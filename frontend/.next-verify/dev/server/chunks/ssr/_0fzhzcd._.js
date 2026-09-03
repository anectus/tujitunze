module.exports = [
"[project]/components/auth/FormField.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FormField
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"use client";
;
function FormField({ id, name, label, type = "text", value, onChange, onBlur, placeholder, autoComplete, inputMode, maxLength, optionalLabel, error, valid, helpText, trailing }) {
    const showCheck = !trailing && valid && !error;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            label && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: id,
                className: "mb-2 block text-sm font-semibold text-gray-700",
                children: [
                    label,
                    optionalLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "ml-2 text-xs font-normal text-gray-500",
                        children: optionalLabel
                    }, void 0, false, {
                        fileName: "[project]/components/auth/FormField.tsx",
                        lineNumber: 57,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/auth/FormField.tsx",
                lineNumber: 51,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: id,
                        name: name,
                        type: type,
                        value: value,
                        onChange: onChange,
                        onBlur: onBlur,
                        placeholder: placeholder,
                        autoComplete: autoComplete,
                        inputMode: inputMode,
                        maxLength: maxLength,
                        "aria-invalid": !!error,
                        className: `w-full rounded-lg border px-4 py-3 text-gray-900 outline-none transition ${trailing || showCheck ? "pr-11" : ""} ${error ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"}`
                    }, void 0, false, {
                        fileName: "[project]/components/auth/FormField.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    trailing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-y-0 right-0 flex items-center pr-3",
                        children: trailing
                    }, void 0, false, {
                        fileName: "[project]/components/auth/FormField.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this) : showCheck ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-y-0 right-0 flex items-center pr-3 text-[#10B981]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: 2,
                            className: "h-5 w-5",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                d: "m4.5 12.75 6 6 9-13.5"
                            }, void 0, false, {
                                fileName: "[project]/components/auth/FormField.tsx",
                                lineNumber: 100,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/auth/FormField.tsx",
                            lineNumber: 92,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/auth/FormField.tsx",
                        lineNumber: 91,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/components/auth/FormField.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-xs text-red-600",
                children: error
            }, void 0, false, {
                fileName: "[project]/components/auth/FormField.tsx",
                lineNumber: 111,
                columnNumber: 9
            }, this) : helpText ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-xs text-gray-500",
                children: helpText
            }, void 0, false, {
                fileName: "[project]/components/auth/FormField.tsx",
                lineNumber: 113,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/components/auth/FormField.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/auth/LoginForm.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/permissions.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/auth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/FormField.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$Spinner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/Spinner.tsx [app-ssr] (ecmascript)");
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
function LoginForm() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loginFormTranslations"][language];
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        identifier: "",
        password: ""
    });
    const [fieldErrors, setFieldErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [touched, setTouched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [showPassword, setShowPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const validateField = (field, value)=>{
        if (field === "identifier" && !value.trim()) {
            return t.usernameRequired;
        }
        if (field === "password" && !value) {
            return t.passwordRequired;
        }
        return undefined;
    };
    const handleChange = (e)=>{
        const { name, value } = e.target;
        const field = name;
        setFormData((previousData)=>({
                ...previousData,
                [field]: value
            }));
        if (touched[field]) {
            setFieldErrors((previous)=>({
                    ...previous,
                    [field]: validateField(field, value)
                }));
        }
        setError("");
        setSuccess("");
    };
    const handleBlur = (e)=>{
        const { name, value } = e.target;
        const field = name;
        setTouched((previous)=>({
                ...previous,
                [field]: true
            }));
        setFieldErrors((previous)=>({
                ...previous,
                [field]: validateField(field, value)
            }));
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        const nextErrors = {
            identifier: validateField("identifier", formData.identifier),
            password: validateField("password", formData.password)
        };
        setFieldErrors(nextErrors);
        setTouched({
            identifier: true,
            password: true
        });
        if (nextErrors.identifier || nextErrors.password) {
            return;
        }
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const response = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["API_URL"]}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    identifier: formData.identifier,
                    password: formData.password
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || t.errorFallback);
            }
            setSuccess(t.successMessage);
            localStorage.setItem(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ACCESS_TOKEN_STORAGE_KEY"], data.accessToken);
            const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["decodeAccessToken"])(data.accessToken);
            if (payload) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeAuthUser"])({
                    userId: payload.sub,
                    roles: payload.roles,
                    firstName: payload.firstName || data.member?.firstName || ""
                });
            }
            const staffDashboardPath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStaffDashboardPath"])(payload?.roles ?? []);
            // A Member lands on the home page after login, whether or not
            // onboarding (the mobile-money form) is complete — the account menu
            // (top right, via the header) carries the "Complete Membership"
            // action, rather than forcing a redirect straight into that form.
            // Staff roles still go straight to their own tenant dashboard.
            router.push(staffDashboardPath ?? "/");
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(t.genericErrorFallback);
            }
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "min-h-screen flex items-center justify-center bg-white px-6 py-12",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full max-w-md",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "text-2xl font-bold text-[#064E3B] tracking-tight",
                            children: "Tujitunze"
                        }, void 0, false, {
                            fileName: "[project]/components/auth/LoginForm.tsx",
                            lineNumber: 169,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "mt-6 text-3xl font-bold text-gray-900",
                            children: t.title
                        }, void 0, false, {
                            fileName: "[project]/components/auth/LoginForm.tsx",
                            lineNumber: 176,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-2 text-sm text-gray-600",
                            children: t.subtitle
                        }, void 0, false, {
                            fileName: "[project]/components/auth/LoginForm.tsx",
                            lineNumber: 180,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/auth/LoginForm.tsx",
                    lineNumber: 167,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-2xl shadow-xl border border-gray-100 p-8",
                    children: [
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/components/auth/LoginForm.tsx",
                            lineNumber: 191,
                            columnNumber: 13
                        }, this),
                        success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-[#064E3B]",
                            children: success
                        }, void 0, false, {
                            fileName: "[project]/components/auth/LoginForm.tsx",
                            lineNumber: 198,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleSubmit,
                            className: "space-y-4",
                            noValidate: true,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    id: "identifier",
                                    name: "identifier",
                                    label: t.usernameLabel,
                                    value: formData.identifier,
                                    onChange: handleChange,
                                    onBlur: handleBlur,
                                    placeholder: t.usernamePlaceholder,
                                    autoComplete: "username",
                                    error: fieldErrors.identifier,
                                    valid: touched.identifier && !!formData.identifier.trim(),
                                    helpText: t.usernameHelp
                                }, void 0, false, {
                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                    lineNumber: 210,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between mb-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "password",
                                                    className: "block text-sm font-semibold text-gray-700",
                                                    children: t.passwordLabel
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                                    lineNumber: 229,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/forgot-password",
                                                    className: "text-sm text-[#064E3B] hover:text-[#065F46] hover:underline",
                                                    children: t.forgotPassword
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                                    lineNumber: 236,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/auth/LoginForm.tsx",
                                            lineNumber: 227,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            id: "password",
                                            name: "password",
                                            label: "",
                                            type: showPassword ? "text" : "password",
                                            value: formData.password,
                                            onChange: handleChange,
                                            onBlur: handleBlur,
                                            placeholder: t.passwordPlaceholder,
                                            autoComplete: "current-password",
                                            error: fieldErrors.password,
                                            trailing: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowPassword((visible)=>!visible),
                                                "aria-label": showPassword ? t.hidePassword : t.showPassword,
                                                "aria-pressed": showPassword,
                                                className: "text-gray-400 hover:text-gray-600 transition",
                                                children: showPassword ? // Eye-off icon
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    xmlns: "http://www.w3.org/2000/svg",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: 1.8,
                                                    className: "h-5 w-5",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        d: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/auth/LoginForm.tsx",
                                                        lineNumber: 276,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 23
                                                }, this) : // Eye icon
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    xmlns: "http://www.w3.org/2000/svg",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: 1.8,
                                                    className: "h-5 w-5",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            d: "M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/auth/LoginForm.tsx",
                                                            lineNumber: 294,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            d: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/auth/LoginForm.tsx",
                                                            lineNumber: 299,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/components/auth/LoginForm.tsx",
                                                lineNumber: 257,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/LoginForm.tsx",
                                            lineNumber: 245,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                    lineNumber: 225,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            id: "rememberMe",
                                            type: "checkbox",
                                            className: "\n                  h-4\n                  w-4\n                  rounded\n                  border-gray-300\n                  text-[#064E3B]\n                  focus:ring-[#064E3B]\n                "
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/LoginForm.tsx",
                                            lineNumber: 317,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            htmlFor: "rememberMe",
                                            className: "text-sm text-gray-600",
                                            children: t.rememberMe
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/LoginForm.tsx",
                                            lineNumber: 330,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                    lineNumber: 315,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    disabled: loading,
                                    className: "\n                w-full\n                flex\n                items-center\n                justify-center\n                gap-2\n                bg-[#064E3B]\n                text-white\n                py-3\n                rounded-lg\n                font-semibold\n                hover:bg-[#065F46]\n                transition-colors\n                duration-300\n                ease-in-out\n                focus:outline-none\n                focus:ring-2\n                focus:ring-[#064E3B]\n                focus:ring-offset-2\n                disabled:opacity-60\n                disabled:cursor-not-allowed\n              ",
                                    children: [
                                        loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$Spinner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                            fileName: "[project]/components/auth/LoginForm.tsx",
                                            lineNumber: 366,
                                            columnNumber: 27
                                        }, this),
                                        loading ? t.loggingIn : t.loginButton
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/auth/LoginForm.tsx",
                                    lineNumber: 340,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/auth/LoginForm.tsx",
                            lineNumber: 203,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-8 text-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-600",
                                children: [
                                    t.noAccount,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/register",
                                        className: "font-semibold text-[#064E3B] hover:text-[#065F46] hover:underline",
                                        children: t.signUp
                                    }, void 0, false, {
                                        fileName: "[project]/components/auth/LoginForm.tsx",
                                        lineNumber: 379,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/auth/LoginForm.tsx",
                                lineNumber: 375,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/auth/LoginForm.tsx",
                            lineNumber: 373,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/auth/LoginForm.tsx",
                    lineNumber: 187,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-6 text-center text-sm text-gray-500",
                    children: t.copyright
                }, void 0, false, {
                    fileName: "[project]/components/auth/LoginForm.tsx",
                    lineNumber: 392,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/auth/LoginForm.tsx",
            lineNumber: 164,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/auth/LoginForm.tsx",
        lineNumber: 162,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/auth/Spinner.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Spinner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function Spinner() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "h-5 w-5 animate-spin text-white",
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
            }, void 0, false, {
                fileName: "[project]/components/auth/Spinner.tsx",
                lineNumber: 9,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
            }, void 0, false, {
                fileName: "[project]/components/auth/Spinner.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/auth/Spinner.tsx",
        lineNumber: 3,
        columnNumber: 5
    }, this);
}
}),
"[project]/constants/translations/auth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "forgotPasswordTranslations",
    ()=>forgotPasswordTranslations,
    "loginFormTranslations",
    ()=>loginFormTranslations,
    "protectedRouteTranslations",
    ()=>protectedRouteTranslations,
    "registerFormTranslations",
    ()=>registerFormTranslations,
    "resetPasswordTranslations",
    ()=>resetPasswordTranslations
]);
const loginFormTranslations = {
    en: {
        title: "Login",
        subtitle: "Enter your credentials to access your account",
        usernameLabel: "Username",
        usernamePlaceholder: "Enter your NIDA number or email",
        usernameHelp: "Log in with your NIDA number or email address.",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        forgotPassword: "Forgot password?",
        showPassword: "Show password",
        hidePassword: "Hide password",
        rememberMe: "Remember me",
        loginButton: "Login",
        loggingIn: "Logging in...",
        noAccount: "Don't have an account?",
        signUp: "Sign Up",
        successMessage: "Login successful.",
        errorFallback: "Invalid NIDA number, email, or password.",
        genericErrorFallback: "Unable to login. Please try again.",
        copyright: "© 2026 Tujitunze. Health Savings & Insurance Management System.",
        usernameRequired: "Enter your NIDA number or email.",
        passwordRequired: "Enter your password."
    },
    sw: {
        title: "Ingia",
        subtitle: "Weka taarifa zako za akaunti ili kufikia akaunti yako",
        usernameLabel: "Jina la Mtumiaji",
        usernamePlaceholder: "Weka namba yako ya NIDA au barua pepe",
        usernameHelp: "Ingia kwa kutumia namba yako ya NIDA au barua pepe.",
        passwordLabel: "Nywila",
        passwordPlaceholder: "Weka nywila yako",
        forgotPassword: "Umesahau nywila?",
        showPassword: "Onyesha nywila",
        hidePassword: "Ficha nywila",
        rememberMe: "Nikumbuke",
        loginButton: "Ingia",
        loggingIn: "Inaingia...",
        noAccount: "Huna akaunti?",
        signUp: "Jisajili",
        successMessage: "Umeingia kikamilifu.",
        errorFallback: "Namba ya NIDA, barua pepe, au nywila si sahihi.",
        genericErrorFallback: "Imeshindwa kuingia. Tafadhali jaribu tena.",
        copyright: "© 2026 Tujitunze. Mfumo wa Akiba ya Afya na Usimamizi wa Bima.",
        usernameRequired: "Weka namba yako ya NIDA au barua pepe.",
        passwordRequired: "Weka nywila yako."
    }
};
const registerFormTranslations = {
    en: {
        title: "Sign Up",
        subtitle: "Create your Tujitunze healthcare account",
        firstName: "First Name",
        firstNamePlaceholder: "Enter your first name",
        secondName: "Second Name",
        secondNamePlaceholder: "Enter your second name",
        optional: "(Optional)",
        surname: "Surname",
        surnamePlaceholder: "Enter your surname",
        phoneNumber: "Phone Number",
        phoneNumberPlaceholder: "0626881149",
        phoneNumberHelp: "You can add more phone numbers later from your profile.",
        nidaNumber: "NIDA Number",
        nidaNumberPlaceholder: "20030707-35805-00002-26",
        nidaNumberHelp: "Type only the digits — the dashes are added automatically. Used to verify your identity.",
        email: "Email Address",
        emailPlaceholder: "example@email.com",
        password: "Password",
        passwordPlaceholder: "Create a password",
        passwordHelp: "Minimum 8 characters.",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Confirm your password",
        termsLabel: "I agree to the Tujitunze terms and conditions and confirm that the information provided is accurate.",
        submit: "Create Account",
        submitting: "Creating Account...",
        alreadyHaveAccount: "Already have an account?",
        login: "Login",
        copyright: "© 2026 Tujitunze. Health Savings & Insurance Management System.",
        passwordTooShort: "Password must be at least 8 characters.",
        successMessage: "Account created. Redirecting you to login...",
        errorFallback: "Sign up failed.",
        sectionPersonalInfo: "Personal Info",
        sectionAccountSetup: "Account Setup",
        sectionAgreement: "Agreement",
        addMoreDetails: "+ Add more details",
        showLessDetails: "− Show less details",
        firstNameRequired: "Enter your first name.",
        surnameRequired: "Enter your surname.",
        phoneNumberRequired: "Enter your phone number.",
        phoneNumberInvalid: "Enter a valid Tanzanian phone number.",
        nidaNumberRequired: "Enter your NIDA number.",
        nidaNumberIncomplete: "NIDA number is incomplete.",
        emailInvalid: "Enter a valid email address.",
        passwordRequired: "Create a password.",
        confirmPasswordRequired: "Confirm your password."
    },
    sw: {
        title: "Jisajili",
        subtitle: "Fungua akaunti yako ya afya ya Tujitunze",
        firstName: "Jina la Kwanza",
        firstNamePlaceholder: "Weka jina lako la kwanza",
        secondName: "Jina la Pili",
        secondNamePlaceholder: "Weka jina lako la pili",
        optional: "(Si lazima)",
        surname: "Jina la Ukoo",
        surnamePlaceholder: "Weka jina lako la ukoo",
        phoneNumber: "Namba ya Simu",
        phoneNumberPlaceholder: "0626881149",
        phoneNumberHelp: "Unaweza kuongeza namba nyingine za simu baadaye kwenye wasifu wako.",
        nidaNumber: "Namba ya NIDA",
        nidaNumberPlaceholder: "20030707-35805-00002-26",
        nidaNumberHelp: "Andika tarakimu tu — mistari hutiwa moja kwa moja. Hutumika kuthibitisha utambulisho wako.",
        email: "Anwani ya Barua Pepe",
        emailPlaceholder: "mfano@barua.com",
        password: "Nywila",
        passwordPlaceholder: "Tengeneza nywila",
        passwordHelp: "Angalau herufi 8.",
        confirmPassword: "Thibitisha Nywila",
        confirmPasswordPlaceholder: "Thibitisha nywila yako",
        termsLabel: "Nakubali masharti na vigezo vya Tujitunze na kuthibitisha kuwa taarifa nilizotoa ni sahihi.",
        submit: "Fungua Akaunti",
        submitting: "Inafungua Akaunti...",
        alreadyHaveAccount: "Una akaunti tayari?",
        login: "Ingia",
        copyright: "© 2026 Tujitunze. Mfumo wa Akiba ya Afya na Usimamizi wa Bima.",
        passwordTooShort: "Nywila lazima iwe na angalau herufi 8.",
        successMessage: "Akaunti imefunguliwa. Unaelekezwa kuingia...",
        errorFallback: "Usajili umeshindwa.",
        sectionPersonalInfo: "Taarifa Binafsi",
        sectionAccountSetup: "Usanidi wa Akaunti",
        sectionAgreement: "Makubaliano",
        addMoreDetails: "+ Ongeza taarifa zaidi",
        showLessDetails: "− Ficha taarifa",
        firstNameRequired: "Weka jina lako la kwanza.",
        surnameRequired: "Weka jina lako la ukoo.",
        phoneNumberRequired: "Weka namba yako ya simu.",
        phoneNumberInvalid: "Weka namba sahihi ya simu ya Tanzania.",
        nidaNumberRequired: "Weka namba yako ya NIDA.",
        nidaNumberIncomplete: "Namba ya NIDA haijakamilika.",
        emailInvalid: "Weka anwani sahihi ya barua pepe.",
        passwordRequired: "Tengeneza nywila.",
        confirmPasswordRequired: "Thibitisha nywila yako."
    }
};
const protectedRouteTranslations = {
    en: {
        checkingAccess: "Checking access..."
    },
    sw: {
        checkingAccess: "Inakagua ufikiaji..."
    }
};
const forgotPasswordTranslations = {
    en: {
        title: "Forgot password?",
        description: "Enter your registered email address or phone number.",
        identifier: "Email or Phone Number",
        submit: "Send Reset Link",
        submitting: "Sending...",
        success: "If an account exists with that email or phone number, password-reset instructions have been sent.",
        emailUnavailable: "Password reset email service is not configured. Please contact support.",
        smsUnavailable: "Password reset SMS service is not configured. Please contact support.",
        otpDescription: "Enter the 6-digit verification code sent to your phone.",
        otp: "Verification code",
        verify: "Verify Code",
        verifying: "Verifying...",
        invalidOtp: "The verification code is invalid or expired.",
        resend: "Resend Code",
        error: "Unable to request a password reset.",
        backToLogin: "Remember your password? Log in"
    },
    sw: {
        title: "Umesahau nywila?",
        description: "Weka barua pepe au namba ya simu iliyosajiliwa.",
        identifier: "Barua Pepe au Namba ya Simu",
        submit: "Tuma Kiungo cha Kubadilisha",
        submitting: "Inatuma...",
        success: "Ikiwa akaunti ipo kwa barua pepe au namba hiyo, maelekezo yametumwa.",
        emailUnavailable: "Huduma ya barua pepe ya kubadilisha nywila haijawekwa. Wasiliana na msaada.",
        smsUnavailable: "Huduma ya SMS ya kubadilisha nywila haijawekwa. Wasiliana na msaada.",
        otpDescription: "Weka msimbo wa tarakimu 6 uliotumwa kwenye simu yako.",
        otp: "Msimbo wa uthibitishaji",
        verify: "Thibitisha Msimbo",
        verifying: "Inathibitisha...",
        invalidOtp: "Msimbo si sahihi au muda wake umeisha.",
        resend: "Tuma tena Msimbo",
        error: "Imeshindwa kuomba kubadilisha nywila.",
        backToLogin: "Unakumbuka nywila? Ingia"
    }
};
const resetPasswordTranslations = {
    en: {
        title: "Create a new password",
        description: "Choose a new password for your account.",
        password: "New password",
        confirmPassword: "Confirm new password",
        submit: "Reset password",
        submitting: "Resetting...",
        success: "Password reset successful. You can now log in.",
        error: "Unable to reset your password.",
        invalidLink: "This password reset link is invalid or expired.",
        passwordMismatch: "Passwords do not match.",
        backToLogin: "Go to login",
        showPassword: "Show password",
        hidePassword: "Hide password"
    },
    sw: {
        title: "Tengeneza nywila mpya",
        description: "Chagua nywila mpya ya akaunti yako.",
        password: "Nywila mpya",
        confirmPassword: "Thibitisha nywila mpya",
        submit: "Badilisha nywila",
        submitting: "Inabadilisha...",
        success: "Nywila imebadilishwa. Sasa unaweza kuingia.",
        error: "Imeshindwa kubadilisha nywila.",
        invalidLink: "Kiungo hiki si sahihi au muda wake umeisha.",
        passwordMismatch: "Nywila hazifanani.",
        backToLogin: "Nenda kuingia",
        showPassword: "Onyesha nywila",
        hidePassword: "Ficha nywila"
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
"[project]/lib/utils/permissions.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACCESS_TOKEN_STORAGE_KEY",
    ()=>ACCESS_TOKEN_STORAGE_KEY,
    "AUTH_USER_STORAGE_KEY",
    ()=>AUTH_USER_STORAGE_KEY,
    "decodeAccessToken",
    ()=>decodeAccessToken,
    "getAccessToken",
    ()=>getAccessToken,
    "getStaffDashboardPath",
    ()=>getStaffDashboardPath,
    "getStoredAuthUser",
    ()=>getStoredAuthUser,
    "hasRole",
    ()=>hasRole,
    "isTokenExpired",
    ()=>isTokenExpired,
    "storeAuthUser",
    ()=>storeAuthUser
]);
const ACCESS_TOKEN_STORAGE_KEY = "tujitunze_access_token";
const AUTH_USER_STORAGE_KEY = "tujitunze_auth_user";
function getAccessToken() {
    if ("TURBOPACK compile-time truthy", 1) {
        return null;
    }
    //TURBOPACK unreachable
    ;
}
function getStoredAuthUser() {
    if ("TURBOPACK compile-time truthy", 1) {
        return null;
    }
    //TURBOPACK unreachable
    ;
    const storedUser = undefined;
}
function storeAuthUser(user) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}
function decodeAccessToken(token) {
    try {
        const payloadSegment = token.split(".")[1];
        const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64);
        return JSON.parse(json);
    } catch  {
        return null;
    }
}
function isTokenExpired(payload) {
    return payload.exp * 1000 <= Date.now();
}
function hasRole(roles, allowedRoles) {
    return allowedRoles.some((role)=>roles.includes(role));
}
// Where each role lands right after login. Staff roles go straight to
// their own dashboard; Member keeps the existing onboarding funnel as the
// default (also the fallback for a token with no recognized role).
const ROLE_DASHBOARD_PATHS = {
    Admin: "/admin/dashboard",
    Bank: "/bank/dashboard",
    Telecom: "/telecom/dashboard",
    Insurance: "/insurance/dashboard",
    "Super-admin": "/super-admin/dashboard"
};
function getStaffDashboardPath(roles) {
    const staffRole = roles.find((role)=>role in ROLE_DASHBOARD_PATHS);
    return staffRole ? ROLE_DASHBOARD_PATHS[staffRole] : null;
}
}),
];

//# sourceMappingURL=_0fzhzcd._.js.map