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
				t.objectStoreNames.contains(this.storeName) || t.createObjectStore(this.storeName, { autoIncrement: !0 });
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
	logRaw(e) {
		return new Promise((t, n) => {
			if (!this.db) return n("DB not initialized");
			let r = this.db.transaction(this.storeName, "readwrite");
			r.objectStore(this.storeName).add(e), r.oncomplete = () => t(), r.onerror = () => n(r.error);
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
async function o(e) {
	let t = new n.Workbook(), r = t.addWorksheet("Logs");
	r.columns = Object.keys(e[0]).map((e) => ({
		header: e,
		key: e
	})), r.columns.forEach((e) => {
		let t = e.header ? e.header.length * 6 : 10;
		r.getColumn(e.key).eachCell({ includeEmpty: !1 }, (e) => {
			let n = e.value ? e.value.toString().length : 0;
			n > t && (t = n);
		}), e.width = t + 4;
	}), r.getRow(1).eachCell((e) => {
		e.font = {
			bold: !0,
			color: { argb: "FFFFFFFF" }
		}, e.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF2C2C2A" }
		};
	});
	let i = {
		info: {
			bg: "FFE6F1FB",
			font: "FF0C447C"
		},
		warn: {
			bg: "FFFAEEDA",
			font: "FF633806"
		},
		error: {
			bg: "FFFCEBEB",
			font: "FF791F1F"
		},
		debug: {
			bg: "FFE1F5EE",
			font: "FF085041"
		}
	};
	return e.forEach((e) => {
		let t = r.addRow(e), n = i[e.level ?? "info"];
		t.eachCell((e) => {
			e.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: n.bg }
			}, e.font = { color: { argb: n.font } };
		});
	}), t.xlsx.writeBuffer();
}
function s(e) {
	return {
		...e,
		timestamp: a(e.timestamp)
	};
}
async function c(n, r = "json") {
	let i = (/* @__PURE__ */ new Date()).toISOString(), a = n.map(s);
	if (a.length !== 0) {
		if (r === "json") t(new Blob([JSON.stringify(a, null, 2)], { type: "application/json" }), `audit-logs-${i}.json`);
		else if (r === "excel") {
			let e = await o(a);
			t(new Blob([e], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `audit-logs-${i}.xlsx`);
		} else if (r === "both") {
			let n = new e();
			n.file("audit-logs.json", JSON.stringify(a, null, 2)), n.file("audit-logs.xlsx", await o(a)), t(await n.generateAsync({ type: "blob" }), `audit-logs-${i}.zip`);
		}
	}
}
//#endregion
//#region src/logging.ts
function l(e) {
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
		let o = t ? String(t) : "Unknown error", s = {
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
var u = class {
	constructor(e) {
		this.storage = new r(e), this.maxDays = e?.maxDays ?? 30, this.maxEntries = e?.maxEntries, this.onStorageFull = e?.onStorageFull, this.onLog = e?.onLog, this.storage.init().catch(console.error), this.pruneInterval = setInterval(() => this.pruneIfNeeded(), 1440 * 60 * 1e3);
	}
	async pruneIfNeeded() {
		let e = await this.storage.getAll(), t = i(e, this.maxDays);
		t.length < e.length && (await this.storage.clearAll(), await Promise.all(t.map((e) => this.storage.logRaw(e))));
	}
	async log(e, t, n = "info", r) {
		if (this.maxEntries !== void 0) {
			let e = await this.storage.getAll();
			e.length >= this.maxEntries && (this.onStorageFull && await this.onStorageFull(e), await this.storage.clearAll());
		}
		let i = {
			action: e,
			payload: t,
			level: n,
			context: r
		};
		await this.storage.log(i), this.onLog && await this.onLog(i).catch(console.error);
	}
	destroy() {
		clearInterval(this.pruneInterval);
	}
	async getLogs() {
		return i(await this.storage.getAll(), this.maxDays);
	}
	async downloadLogs(e = "json") {
		await c(await this.getLogs(), e);
	}
	async clearLogs() {
		await this.storage.clearAll();
	}
};
//#endregion
export { u as AuditLog, l as setupGlobalLogging };
