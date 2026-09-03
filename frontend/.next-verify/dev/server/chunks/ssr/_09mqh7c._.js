module.exports = [
"[project]/app/(super-admin)/super-admin/administrators/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SuperAdminAdministratorsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/permissions.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$nida$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/nida.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$dashboard$2f$DashboardHeader$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/dashboard/DashboardHeader.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$common$2f$StatusBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/common/StatusBadge.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$super$2d$admin$2d$administrators$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/super-admin-administrators.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/common.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/api.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
;
const STAFF_ROLES = [
    "Admin",
    "Bank",
    "Telecom",
    "Insurance",
    "Super-admin"
];
const TENANT_ROLE_KEY = {
    Bank: "banks",
    Telecom: "telecomOperators",
    Insurance: "insuranceProviders"
};
const EMPTY_TENANTS = {
    banks: [],
    telecomOperators: [],
    insuranceProviders: []
};
const EMPTY_FORM = {
    firstName: "",
    secondName: "",
    surname: "",
    email: "",
    nidaNumber: "",
    password: "",
    role: "Bank",
    tenantId: ""
};
function extractMessage(body, fallback) {
    if (body && typeof body === "object" && "message" in body) {
        const message = body.message;
        if (Array.isArray(message)) return message.join(" ");
        if (typeof message === "string") return message;
    }
    return fallback;
}
function SuperAdminAdministratorsPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$super$2d$admin$2d$administrators$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["superAdminAdministratorsTranslations"][language];
    const roleLabels = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleLabelTranslations"][language];
    const [administrators, setAdministrators] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [tenants, setTenants] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(EMPTY_TENANTS);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [loadError, setLoadError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(EMPTY_FORM);
    const [submitting, setSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [formError, setFormError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const loadData = async ()=>{
            const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAccessToken"])();
            if (!token) {
                router.push("/login");
                return;
            }
            try {
                const [administratorsRes, tenantsRes] = await Promise.all([
                    fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["API_URL"]}/super-admin/administrators`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["API_URL"]}/super-admin/tenants`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);
                if (administratorsRes.status === 401 || tenantsRes.status === 401) {
                    router.push("/login");
                    return;
                }
                const administratorsBody = await administratorsRes.json();
                const tenantsBody = await tenantsRes.json();
                if (!administratorsRes.ok) {
                    throw new Error(extractMessage(administratorsBody, t.loadAdministratorsError));
                }
                if (!tenantsRes.ok) {
                    throw new Error(extractMessage(tenantsBody, t.loadTenantsError));
                }
                setAdministrators(administratorsBody);
                setTenants(tenantsBody);
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : t.loadPageError);
            } finally{
                setLoading(false);
            }
        };
        loadData();
    }, [
        router,
        t.loadAdministratorsError,
        t.loadTenantsError,
        t.loadPageError
    ]);
    const tenantOptionsForRole = (role)=>{
        const key = TENANT_ROLE_KEY[role];
        return key ? tenants[key] : [];
    };
    const requiresTenant = Boolean(TENANT_ROLE_KEY[form.role]);
    const handleSubmit = async (event)=>{
        event.preventDefault();
        setFormError("");
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAccessToken"])();
        if (!token) {
            router.push("/login");
            return;
        }
        if (requiresTenant && !form.tenantId) {
            setFormError(t.tenantRequiredError.replace("{role}", roleLabels[form.role]));
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["API_URL"]}/super-admin/administrators`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: form.firstName,
                    secondName: form.secondName || undefined,
                    surname: form.surname,
                    email: form.email,
                    nidaNumber: form.nidaNumber,
                    password: form.password,
                    role: form.role,
                    tenantId: requiresTenant ? Number(form.tenantId) : undefined
                })
            });
            const body = await response.json();
            if (!response.ok) {
                throw new Error(extractMessage(body, t.createError));
            }
            setAdministrators((prev)=>[
                    {
                        userId: body.userId,
                        firstName: body.firstName,
                        secondName: body.secondName,
                        surname: body.surname,
                        email: body.email,
                        status: body.memberStatus,
                        createdAt: body.createdAt,
                        role: body.role,
                        tenantName: tenantOptionsForRole(form.role).find((option)=>option.id === Number(form.tenantId))?.name ?? null
                    },
                    ...prev
                ]);
            setForm(EMPTY_FORM);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : t.createError);
        } finally{
            setSubmitting(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$dashboard$2f$DashboardHeader$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                title: t.title
            }, void 0, false, {
                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                lineNumber: 227,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 sm:p-8",
                children: [
                    loadError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700",
                        children: loadError
                    }, void 0, false, {
                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                        lineNumber: 232,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl border border-gray-100 bg-white p-6 shadow-md",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-bold text-gray-900",
                                children: t.createTitle
                            }, void 0, false, {
                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                lineNumber: 239,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-gray-600",
                                children: t.createSubtitle
                            }, void 0, false, {
                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                lineNumber: 240,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: handleSubmit,
                                className: "mt-6 grid gap-4 sm:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700",
                                                children: t.firstName
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 247,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                value: form.firstName,
                                                onChange: (e)=>setForm({
                                                        ...form,
                                                        firstName: e.target.value
                                                    }),
                                                className: "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 248,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 246,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700",
                                                children: t.surname
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 257,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                value: form.surname,
                                                onChange: (e)=>setForm({
                                                        ...form,
                                                        surname: e.target.value
                                                    }),
                                                className: "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 258,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 256,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700",
                                                children: t.email
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 267,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                type: "email",
                                                value: form.email,
                                                onChange: (e)=>setForm({
                                                        ...form,
                                                        email: e.target.value
                                                    }),
                                                className: "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 268,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700",
                                                children: t.nidaNumber
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 278,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                value: form.nidaNumber,
                                                onChange: (e)=>setForm({
                                                        ...form,
                                                        nidaNumber: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$nida$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatNidaNumber"])(e.target.value)
                                                    }),
                                                placeholder: "00000000-00000-00000-00",
                                                className: "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 279,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 277,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700",
                                                children: t.password
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 291,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                required: true,
                                                type: "password",
                                                minLength: 8,
                                                value: form.password,
                                                onChange: (e)=>setForm({
                                                        ...form,
                                                        password: e.target.value
                                                    }),
                                                className: "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 292,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 290,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700",
                                                children: t.role
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 303,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                value: form.role,
                                                onChange: (e)=>setForm({
                                                        ...form,
                                                        role: e.target.value,
                                                        tenantId: ""
                                                    }),
                                                className: "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm",
                                                children: STAFF_ROLES.map((role)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: role,
                                                        children: roleLabels[role]
                                                    }, role, false, {
                                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                        lineNumber: 316,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 304,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 302,
                                        columnNumber: 13
                                    }, this),
                                    requiresTenant && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "sm:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700",
                                                children: roleLabels[form.role]
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 325,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                required: true,
                                                value: form.tenantId,
                                                onChange: (e)=>setForm({
                                                        ...form,
                                                        tenantId: e.target.value
                                                    }),
                                                className: "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "",
                                                        children: [
                                                            t.selectTenantPrefix,
                                                            " ",
                                                            roleLabels[form.role],
                                                            "..."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                        lineNumber: 334,
                                                        columnNumber: 19
                                                    }, this),
                                                    tenantOptionsForRole(form.role).map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: option.id,
                                                            children: option.name
                                                        }, option.id, false, {
                                                            fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                            lineNumber: 338,
                                                            columnNumber: 21
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 328,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 324,
                                        columnNumber: 15
                                    }, this),
                                    formError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "sm:col-span-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700",
                                        children: formError
                                    }, void 0, false, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 347,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "sm:col-span-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "submit",
                                            disabled: submitting,
                                            className: "rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50",
                                            children: submitting ? t.creating : t.createButton
                                        }, void 0, false, {
                                            fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                            lineNumber: 353,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 352,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                lineNumber: 244,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                        lineNumber: 237,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-left text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: "bg-gray-50 text-xs uppercase text-gray-500",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 font-semibold",
                                                children: t.colName
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 372,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 font-semibold",
                                                children: t.colEmail
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 373,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 font-semibold",
                                                children: t.colRole
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 374,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 font-semibold",
                                                children: t.colTenant
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 375,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 font-semibold",
                                                children: t.colStatus
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 376,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-6 py-3 font-semibold",
                                                children: t.colCreated
                                            }, void 0, false, {
                                                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                lineNumber: 377,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 371,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                    lineNumber: 370,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "divide-y divide-gray-100",
                                    children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-6 py-4 text-gray-500",
                                            colSpan: 6,
                                            children: t.loadingRow
                                        }, void 0, false, {
                                            fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                            lineNumber: 385,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 384,
                                        columnNumber: 17
                                    }, this) : administrators.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-6 py-4 text-gray-500",
                                            colSpan: 6,
                                            children: t.emptyRow
                                        }, void 0, false, {
                                            fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                            lineNumber: 391,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                        lineNumber: 390,
                                        columnNumber: 17
                                    }, this) : administrators.map((admin)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-4 font-medium text-gray-900",
                                                    children: [
                                                        admin.firstName,
                                                        " ",
                                                        admin.surname
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                    lineNumber: 398,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-4 text-gray-600",
                                                    children: admin.email
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                    lineNumber: 401,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-4 text-gray-600",
                                                    children: roleLabels[admin.role] ?? admin.role
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                    lineNumber: 402,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-4 text-gray-600",
                                                    children: admin.tenantName ?? "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                    lineNumber: 405,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$common$2f$StatusBadge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        domain: "member",
                                                        status: admin.status
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                        lineNumber: 409,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                    lineNumber: 408,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-6 py-4 whitespace-nowrap text-gray-600",
                                                    children: new Date(admin.createdAt).toLocaleDateString("en-TZ")
                                                }, void 0, false, {
                                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                                    lineNumber: 411,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, admin.userId, true, {
                                            fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                            lineNumber: 397,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                                    lineNumber: 381,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                            lineNumber: 368,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                        lineNumber: 366,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
                lineNumber: 229,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(super-admin)/super-admin/administrators/page.tsx",
        lineNumber: 225,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/common/StatusBadge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StatusBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Badge.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$statuses$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/statuses.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$statuses$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/statuses.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function StatusBadge({ domain, status, className }) {
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const style = (0, __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$statuses$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusStyle"])(domain, status);
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$statuses$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStatusLabel"])(language, domain, status);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        tone: style.tone,
        className: className,
        children: label
    }, void 0, false, {
        fileName: "[project]/components/common/StatusBadge.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/dashboard/DashboardHeader.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useAuth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/common.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function DashboardHeader({ title }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { firstName, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["commonTranslations"][language];
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const rootRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) {
            return;
        }
        function handlePointerDown(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return ()=>{
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        open
    ]);
    const handleLogout = ()=>{
        setOpen(false);
        logout();
        router.push("/login");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "border-b border-gray-100 bg-white px-4 py-4 sm:px-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-xl font-bold text-gray-900 sm:text-2xl",
                    children: title
                }, void 0, false, {
                    fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: rootRef,
                    className: "relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>setOpen((previous)=>!previous),
                            "aria-haspopup": "menu",
                            "aria-expanded": open,
                            className: "\n            flex\n            items-center\n            gap-2\n            rounded-lg\n            px-2 py-1.5\n            text-gray-600\n            transition\n            hover:bg-gray-50\n            hover:text-blue-700",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700",
                                    children: (firstName?.[0] ?? "?").toUpperCase()
                                }, void 0, false, {
                                    fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, this),
                                firstName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "hidden text-sm font-medium text-gray-700 sm:inline",
                                    children: firstName
                                }, void 0, false, {
                                    fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                                    lineNumber: 92,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    xmlns: "http://www.w3.org/2000/svg",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: 2,
                                    "aria-hidden": "true",
                                    className: `h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        d: "M19.5 8.25l-7.5 7.5-7.5-7.5"
                                    }, void 0, false, {
                                        fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                                        lineNumber: 106,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this),
                        open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            role: "menu",
                            className: "\n              absolute\n              right-0\n              top-full\n              z-10\n              mt-2\n              w-44\n              overflow-hidden\n              rounded-lg\n              border\n              border-gray-100\n              bg-white\n              py-1\n              shadow-xl",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                role: "menuitem",
                                onClick: handleLogout,
                                className: "block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700",
                                children: t.logOut
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                                lineNumber: 132,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                            lineNumber: 115,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/dashboard/DashboardHeader.tsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/dashboard/DashboardHeader.tsx",
            lineNumber: 63,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/dashboard/DashboardHeader.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/ui/Badge.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Badge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$statuses$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/statuses.ts [app-ssr] (ecmascript)");
;
;
function Badge({ tone = "neutral", children, className = "" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        ${__TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$statuses$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STATUS_TONE_CLASSES"][tone].badgeClass}
        ${className}
      `,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/ui/Badge.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/constants/statuses.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Semantic status-color reference. Health-status colors (green/amber/red)
// are the same pattern WHO dashboards and most health-sector systems use,
// so reusing it here means a claim/coverage status is understandable at a
// glance without any legend. Domain status maps below are the single
// source of truth — components should never hardcode a status color
// inline, they should look it up here.
__turbopack_context__.s([
    "CLAIM_STATUS",
    ()=>CLAIM_STATUS,
    "COVERAGE_STATUS",
    ()=>COVERAGE_STATUS,
    "MEMBER_STATUS",
    ()=>MEMBER_STATUS,
    "PARTNER_STATUS",
    ()=>PARTNER_STATUS,
    "STATUS_TONE_CLASSES",
    ()=>STATUS_TONE_CLASSES,
    "TRANSACTION_STATUS",
    ()=>TRANSACTION_STATUS,
    "getStatusStyle",
    ()=>getStatusStyle
]);
const STATUS_TONE_CLASSES = {
    success: {
        badgeClass: "bg-green-100 text-green-800 border border-green-200",
        dotClass: "bg-green-500",
        textClass: "text-green-700"
    },
    warning: {
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
        dotClass: "bg-amber-500",
        textClass: "text-amber-700"
    },
    danger: {
        badgeClass: "bg-red-100 text-red-800 border border-red-200",
        dotClass: "bg-red-500",
        textClass: "text-red-700"
    },
    neutral: {
        badgeClass: "bg-gray-100 text-gray-700 border border-gray-200",
        dotClass: "bg-gray-400",
        textClass: "text-gray-600"
    },
    info: {
        badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
        dotClass: "bg-blue-500",
        textClass: "text-blue-700"
    }
};
function statusStyle(label, tone) {
    return {
        label,
        tone
    };
}
const CLAIM_STATUS = {
    draft: statusStyle("Draft", "neutral"),
    submitted: statusStyle("Submitted", "info"),
    under_review: statusStyle("Under Review", "warning"),
    pending: statusStyle("Pending", "warning"),
    approved: statusStyle("Approved", "success"),
    rejected: statusStyle("Rejected", "danger"),
    disputed: statusStyle("Disputed", "danger")
};
const COVERAGE_STATUS = {
    active: statusStyle("Active", "success"),
    pending_activation: statusStyle("Pending Activation", "info"),
    suspended: statusStyle("Suspended", "warning"),
    expired: statusStyle("Expired", "danger")
};
const TRANSACTION_STATUS = {
    completed: statusStyle("Completed", "success"),
    pending: statusStyle("Pending", "warning"),
    processing: statusStyle("Processing", "warning"),
    received: statusStyle("Received", "info"),
    validated: statusStyle("Validated", "info"),
    allocated: statusStyle("Allocated", "success"),
    failed: statusStyle("Failed", "danger"),
    reversed: statusStyle("Reversed", "neutral"),
    // payment_transactions' own status vocabulary (e.g. Vodacom M-Pesa
    // collection) — added rather than reusing "completed"/"allocated"
    // since a payment's terminal success state is a distinct value
    // ("SUCCESSFUL") from the contribution ledger it produces.
    successful: statusStyle("Successful", "success"),
    pending_review: statusStyle("Pending Review", "warning"),
    // outgoing_transaction_savings' own terminal state when a rule
    // isn't active yet (see CLAUDE.md 2026-09-02 dual-mode savings
    // entry) — the underlying payment still settled, Tujitunze just
    // credited nothing, so this is deliberately neutral, not a failure.
    skipped: statusStyle("Skipped", "neutral")
};
const MEMBER_STATUS = {
    pending: statusStyle("Pending Verification", "warning"),
    active: statusStyle("Active", "success"),
    inactive: statusStyle("Inactive", "neutral"),
    suspended: statusStyle("Suspended", "danger")
};
const PARTNER_STATUS = {
    active: statusStyle("Active", "success"),
    inactive: statusStyle("Inactive", "neutral"),
    suspended: statusStyle("Suspended", "danger")
};
const STATUS_MAPS = {
    claim: CLAIM_STATUS,
    coverage: COVERAGE_STATUS,
    transaction: TRANSACTION_STATUS,
    member: MEMBER_STATUS,
    partner: PARTNER_STATUS
};
const FALLBACK_STATUS = statusStyle("Unknown", "neutral");
function getStatusStyle(domain, status) {
    return STATUS_MAPS[domain][status.toLowerCase()] ?? FALLBACK_STATUS;
}
}),
"[project]/constants/translations/statuses.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStatusLabel",
    ()=>getStatusLabel,
    "statusLabelTranslations",
    ()=>statusLabelTranslations
]);
const statusLabelTranslations = {
    en: {
        claim: {
            draft: "Draft",
            submitted: "Submitted",
            under_review: "Under Review",
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            disputed: "Disputed"
        },
        coverage: {
            active: "Active",
            pending_activation: "Pending Activation",
            suspended: "Suspended",
            expired: "Expired"
        },
        transaction: {
            completed: "Completed",
            pending: "Pending",
            processing: "Processing",
            received: "Received",
            validated: "Validated",
            allocated: "Allocated",
            failed: "Failed",
            reversed: "Reversed",
            successful: "Successful",
            pending_review: "Pending Review",
            skipped: "Skipped"
        },
        member: {
            pending: "Pending Verification",
            active: "Active",
            inactive: "Inactive",
            suspended: "Suspended"
        },
        partner: {
            active: "Active",
            inactive: "Inactive",
            suspended: "Suspended"
        },
        unknown: "Unknown"
    },
    sw: {
        claim: {
            draft: "Rasimu",
            submitted: "Imewasilishwa",
            under_review: "Inakaguliwa",
            pending: "Inasubiri",
            approved: "Imeidhinishwa",
            rejected: "Imekataliwa",
            disputed: "Inapingwa"
        },
        coverage: {
            active: "Hai",
            pending_activation: "Inasubiri Uamilishaji",
            suspended: "Imesimamishwa",
            expired: "Imeisha Muda"
        },
        transaction: {
            completed: "Imekamilika",
            pending: "Inasubiri",
            processing: "Inachakatwa",
            received: "Imepokelewa",
            validated: "Imethibitishwa",
            allocated: "Imetengwa",
            failed: "Imeshindwa",
            reversed: "Imerejeshwa",
            successful: "Imefanikiwa",
            pending_review: "Inasubiri Ukaguzi",
            skipped: "Imerukwa"
        },
        member: {
            pending: "Inasubiri Uthibitisho",
            active: "Hai",
            inactive: "Haifanyi Kazi",
            suspended: "Imesimamishwa"
        },
        partner: {
            active: "Hai",
            inactive: "Haifanyi Kazi",
            suspended: "Imesimamishwa"
        },
        unknown: "Haijulikani"
    }
};
function getStatusLabel(language, domain, status) {
    const table = statusLabelTranslations[language];
    const domainTable = table[domain];
    return domainTable[status.toLowerCase()] ?? table.unknown;
}
}),
"[project]/constants/translations/super-admin-administrators.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "superAdminAdministratorsTranslations",
    ()=>superAdminAdministratorsTranslations
]);
const superAdminAdministratorsTranslations = {
    en: {
        title: "Administrators",
        createTitle: "Create Administrator",
        createSubtitle: "Provision a staff account for Admin, Bank, Telecom, Insurance, or Super-admin. Member accounts are created only through registration.",
        firstName: "First Name",
        surname: "Surname",
        email: "Email",
        nidaNumber: "NIDA Number",
        password: "Password",
        role: "Role",
        selectTenantPrefix: "Select",
        tenantRequiredError: "Select which {role} this account belongs to.",
        loadAdministratorsError: "Unable to load administrators.",
        loadTenantsError: "Unable to load tenants.",
        loadPageError: "Unable to load this page.",
        createError: "Unable to create this account.",
        creating: "Creating...",
        createButton: "Create Administrator",
        colName: "Name",
        colEmail: "Email",
        colRole: "Role",
        colTenant: "Tenant",
        colStatus: "Status",
        colCreated: "Created",
        loadingRow: "Loading...",
        emptyRow: "No staff accounts yet."
    },
    sw: {
        title: "Wasimamizi",
        createTitle: "Fungua Akaunti ya Msimamizi",
        createSubtitle: "Fungua akaunti ya mfanyakazi kwa Msimamizi, Benki, Simu, Bima, au Msimamizi Mkuu. Akaunti za Wanachama zinafunguliwa tu kupitia usajili.",
        firstName: "Jina la Kwanza",
        surname: "Jina la Ukoo",
        email: "Barua Pepe",
        nidaNumber: "Namba ya NIDA",
        password: "Nywila",
        role: "Jukumu",
        selectTenantPrefix: "Chagua",
        tenantRequiredError: "Chagua {role} ambayo akaunti hii ni yake.",
        loadAdministratorsError: "Imeshindwa kupakia wasimamizi.",
        loadTenantsError: "Imeshindwa kupakia taasisi.",
        loadPageError: "Imeshindwa kupakia ukurasa huu.",
        createError: "Imeshindwa kufungua akaunti hii.",
        creating: "Inafungua...",
        createButton: "Fungua Akaunti ya Msimamizi",
        colName: "Jina",
        colEmail: "Barua Pepe",
        colRole: "Jukumu",
        colTenant: "Taasisi",
        colStatus: "Hali",
        colCreated: "Imeundwa",
        loadingRow: "Inapakia...",
        emptyRow: "Hakuna akaunti za wafanyakazi bado."
    }
};
}),
"[project]/lib/utils/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "API_URL",
    ()=>API_URL
]);
// The backend API's base URL, computed once per page load.
//
// NEXT_PUBLIC_API_URL overrides this outright when set (useful if the
// backend ever runs on a different host/port than the frontend) — see
// .env.example. Left unset by default: the frontend and backend always
// run on the same machine here (just ports 3001 vs 3012), so deriving
// the backend's address from whatever host the browser used to load
// THIS page means the app keeps working automatically across
// localhost, a LAN IP, or a public IP that changes with the network —
// without editing an env file and restarting every time it does.
function resolveApiUrl() {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Server-side (SSR) fallback — none of this file's callers actually
    // render a URL during SSR (all fetches run client-side in useEffect),
    // so this value is never user-visible; it only needs to not throw.
    return "http://localhost:3012";
}
const API_URL = resolveApiUrl();
}),
"[project]/lib/utils/nida.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Tanzania NIDA number: 20 digits, grouped 8-5-5-2 with dashes
// (e.g. 20030707-35805-00002-26). The user only ever types digits — this
// inserts the dashes automatically as they type, and strips anything that
// isn't a digit (pasted dashes/spaces included).
__turbopack_context__.s([
    "NIDA_DIGIT_COUNT",
    ()=>NIDA_DIGIT_COUNT,
    "NIDA_FORMATTED_LENGTH",
    ()=>NIDA_FORMATTED_LENGTH,
    "NIDA_PATTERN",
    ()=>NIDA_PATTERN,
    "formatNidaNumber",
    ()=>formatNidaNumber
]);
const NIDA_DIGIT_COUNT = 20;
const NIDA_FORMATTED_LENGTH = 23; // 20 digits + 3 dashes
const NIDA_PATTERN = /^\d{8}-\d{5}-\d{5}-\d{2}$/;
function formatNidaNumber(rawValue) {
    const digits = rawValue.replace(/\D/g, "").slice(0, NIDA_DIGIT_COUNT);
    const groups = [
        digits.slice(0, 8),
        digits.slice(8, 13),
        digits.slice(13, 18),
        digits.slice(18, 20)
    ].filter((group)=>group.length > 0);
    return groups.join("-");
}
}),
];

//# sourceMappingURL=_09mqh7c._.js.map