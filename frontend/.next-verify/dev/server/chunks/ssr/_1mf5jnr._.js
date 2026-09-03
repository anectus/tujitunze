module.exports = [
"[project]/app/error.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Error
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$system$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/system-pages.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function Error({ error, reset }) {
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$system$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["errorPageTranslations"][language];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        console.error(error);
    }, [
        error
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen flex items-center justify-center bg-white px-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "mb-4 text-3xl font-bold text-red-600",
                    children: t.title
                }, void 0, false, {
                    fileName: "[project]/app/error.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mb-6 text-gray-600",
                    children: t.description
                }, void 0, false, {
                    fileName: "[project]/app/error.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>reset(),
                    className: "rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700",
                    children: t.tryAgain
                }, void 0, false, {
                    fileName: "[project]/app/error.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/error.tsx",
            lineNumber: 24,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/error.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/constants/translations/system-pages.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accessDeniedTranslations",
    ()=>accessDeniedTranslations,
    "errorPageTranslations",
    ()=>errorPageTranslations,
    "loadingPageTranslations",
    ()=>loadingPageTranslations,
    "notFoundTranslations",
    ()=>notFoundTranslations
]);
const accessDeniedTranslations = {
    en: {
        title: "Access Denied",
        description: "Your account does not have permission to view this page.",
        backToLogin: "Back to Login"
    },
    sw: {
        title: "Ufikiaji Umekataliwa",
        description: "Akaunti yako haina ruhusa ya kuona ukurasa huu.",
        backToLogin: "Rudi Kuingia"
    }
};
const notFoundTranslations = {
    en: {
        title: "Page Not Found",
        description: "Sorry, the page you are looking for does not exist.",
        goHome: "Go Home"
    },
    sw: {
        title: "Ukurasa Haukupatikana",
        description: "Samahani, ukurasa unaoutafuta haupo.",
        goHome: "Rudi Nyumbani"
    }
};
const errorPageTranslations = {
    en: {
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
        tryAgain: "Try Again"
    },
    sw: {
        title: "Hitilafu imetokea",
        description: "Hitilafu isiyotarajiwa imetokea. Tafadhali jaribu tena.",
        tryAgain: "Jaribu Tena"
    }
};
const loadingPageTranslations = {
    en: {
        title: "Loading HSIMS...",
        description: "Please wait a moment."
    },
    sw: {
        title: "Inapakia HSIMS...",
        description: "Tafadhali subiri kidogo."
    }
};
}),
];

//# sourceMappingURL=_1mf5jnr._.js.map