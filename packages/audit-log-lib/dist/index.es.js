import e from "jszip";
import { saveAs as t } from "file-saver";
import n from "exceljs";
//#region src/storage.ts
var r = class {
	constructor(e) {
		this.db = null, this.dbName = e?.dbName || "audit-log-db", this.storeName = e?.storeName || "logs";
	}
	init() {
		return new Promise((e, t) => {
			let n = indexedDB.open(this.dbName, 1);
			n.onupgradeneeded = (e) => {
				let t = e.target.result;
				t.objectStoreNames.contains(this.storeName) || t.createObjectStore(this.storeName, { keyPath: "timestamp" });
			}, n.onsuccess = (t) => {
				this.db = t.target.result, e();
			}, n.onerror = () => t(n.error);
		});
	}
	log(e) {
		return new Promise((t, n) => {
			if (!this.db) return n("DB not initialized");
			let r = this.db.transaction(this.storeName, "readwrite"), i = r.objectStore(this.storeName), a = {
				...e,
				timestamp: Date.now()
			};
			i.add(a), r.oncomplete = () => t(), r.onerror = () => n(r.error);
		});
	}
	getAll() {
		return new Promise((e, t) => {
			if (!this.db) return t("DB not initialized");
			let n = this.db.transaction(this.storeName, "readonly").objectStore(this.storeName).getAll();
			n.onsuccess = () => e(n.result), n.onerror = () => t(n.error);
		});
	}
	clearAll() {
		return new Promise((e, t) => {
			if (!this.db) return t("DB not initialized");
			let n = this.db.transaction(this.storeName, "readwrite");
			n.objectStore(this.storeName).clear(), n.oncomplete = () => e(), n.onerror = () => t(n.error);
		});
	}
};
//#endregion
//#region src/utils.ts
function i(e, t) {
	let n = Date.now() - t * 24 * 60 * 60 * 1e3;
	return e.filter((e) => e.timestamp >= n);
}
function a(e) {
	let t = e ? new Date(e) : /* @__PURE__ */ new Date(), n = (e) => e.toString().padStart(2, "0");
	return `${t.getFullYear()}-${n(t.getMonth() + 1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}:${n(t.getSeconds())}`;
}
async function o(r, i = "json") {
	let o = (/* @__PURE__ */ new Date()).toISOString(), s = r.map((e) => ({
		...e,
		timestamp: a(e.timestamp)
	}));
	if (i === "json") t(new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }), `audit-logs-${o}.json`);
	else if (i === "excel") {
		let e = new n.Workbook(), r = e.addWorksheet("Logs");
		r.columns = Object.keys(s[0] || {}).map((e) => ({
			header: e,
			key: e
		})), s.forEach((e) => r.addRow(e));
		let i = await e.xlsx.writeBuffer();
		t(new Blob([i], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `audit-logs-${o}.xlsx`);
	} else if (i === "both") {
		let r = new e();
		r.file("audit-logs.json", JSON.stringify(s, null, 2));
		let i = new n.Workbook(), a = i.addWorksheet("Logs");
		a.columns = Object.keys(s[0] || {}).map((e) => ({
			header: e,
			key: e
		})), s.forEach((e) => a.addRow(e));
		let c = await i.xlsx.writeBuffer();
		r.file("audit-logs.xlsx", c), t(await r.generateAsync({ type: "blob" }), `audit-logs-${o}.zip`);
	}
}
async function s(e, t) {
	return e.length >= t && confirm("Audit logs are full. Do you want to download and clear them?") ? (await o(e), !0) : !1;
}
//#endregion
//#region src/logging.ts
function c(e) {
	[
		"log",
		"warn",
		"error"
	].forEach((t) => {
		let n = console[t].bind(console);
		console[t] = (...r) => {
			n(...r);
			let i = r[0] ?? "", a = r[1] ?? (r.length > 2 ? r.slice(1) : null);
			e.log(i, a, t === "log" ? "info" : t === "warn" ? "warn" : "error", {
				url: window.location.href,
				type: "console"
			});
		};
	}), window.onerror = (t, n, r, i, a) => {
		let o = String(t) ?? "Unknown error", s = {
			source: n,
			lineno: r,
			colno: i,
			stack: a?.stack ?? null
		};
		e.log(o, s, "error", {
			url: window.location.href,
			type: "console"
		});
	}, window.onunhandledrejection = (t) => {
		let n = t.reason;
		e.log("Unhandled promise rejection", n, "error", {
			url: window.location.href,
			type: "error"
		});
	};
}
//#endregion
//#region src/index.ts
var l = class {
	constructor(e) {
		this.maxDays = 7, this.maxEntries = 5e3, this.storage = new r(e), this.maxDays = e?.maxDays ?? 7, this.maxEntries = e?.maxEntries ?? 5e3, this.storage.init().catch(console.error);
	}
	async log(e, t, n = "info", r) {
		let a = await this.storage.getAll();
		a = i(a, this.maxDays), await s(a, this.maxEntries) && (await this.storage.clearAll(), a = []), await this.storage.log({
			action: e,
			payload: t,
			level: n,
			context: r
		});
	}
	async getLogs() {
		return i(await this.storage.getAll(), this.maxDays);
	}
	async downloadLogs(e = "json") {
		await o(await this.getLogs(), e);
	}
	async clearLogs() {
		await this.storage.clearAll();
	}
};
//#endregion
export { l as AuditLog, c as setupGlobalLogging };
