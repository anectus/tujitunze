module.exports = [
"[project]/components/auth/ProtectedRoute.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProtectedRoute
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useAuth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/permissions.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/auth.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
function ProtectedRoute({ allowedRoles, children }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { roles, isAuthenticated, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["protectedRouteTranslations"][language];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isLoading) {
            return;
        }
        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasRole"])(roles, allowedRoles)) {
            router.replace("/access-denied");
        }
    }, [
        isLoading,
        isAuthenticated,
        roles,
        allowedRoles,
        router
    ]);
    if (isLoading || !isAuthenticated || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hasRole"])(roles, allowedRoles)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex min-h-screen items-center justify-center bg-white",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-500",
                children: t.checkingAccess
            }, void 0, false, {
                fileName: "[project]/components/auth/ProtectedRoute.tsx",
                lineNumber: 43,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/auth/ProtectedRoute.tsx",
            lineNumber: 42,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/components/auth/ProtectedRoute.tsx",
        lineNumber: 48,
        columnNumber: 10
    }, this);
}
}),
"[project]/components/common/Footer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Footer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$home$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/home.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const SOCIAL_LINKS = [
    {
        label: "Facebook",
        glyph: "f"
    },
    {
        label: "X",
        glyph: "X"
    },
    {
        label: "LinkedIn",
        glyph: "in"
    }
];
const LINK_CLASS = "text-sm text-[#D1FAE5] hover:text-[#10B981] transition-colors duration-300 ease-in-out";
const BOTTOM_LINK_CLASS = "text-xs text-[#9CA3AF] hover:text-[#10B981] transition-colors duration-300 ease-in-out";
const HEADING_CLASS = "text-sm font-semibold text-[#ECFDF5] uppercase tracking-wide mb-4";
function Footer() {
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$home$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["footerTranslations"][language];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
        className: "bg-gradient-to-b from-[#064E3B] to-[#065F46] text-[#D1FAE5]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto px-6 py-8 sm:py-10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y divide-[#065F46] sm:divide-y-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-6 first:pt-0 sm:pt-0 text-center sm:text-left",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    className: "text-2xl font-bold text-[#ECFDF5]",
                                    children: "Tujitunze"
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 37,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-3 text-xs leading-relaxed text-[#D1FAE5]/70",
                                    children: t.description
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/common/Footer.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-6 first:pt-0 sm:pt-0 text-center sm:text-left",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: HEADING_CLASS,
                                    children: t.navigation
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 48,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "space-y-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/",
                                                className: LINK_CLASS,
                                                children: t.home
                                            }, void 0, false, {
                                                fileName: "[project]/components/common/Footer.tsx",
                                                lineNumber: 52,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 51,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/about",
                                                className: LINK_CLASS,
                                                children: t.about
                                            }, void 0, false, {
                                                fileName: "[project]/components/common/Footer.tsx",
                                                lineNumber: 58,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 57,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/services",
                                                className: LINK_CLASS,
                                                children: t.services
                                            }, void 0, false, {
                                                fileName: "[project]/components/common/Footer.tsx",
                                                lineNumber: 64,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 63,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/contact",
                                                className: LINK_CLASS,
                                                children: t.contact
                                            }, void 0, false, {
                                                fileName: "[project]/components/common/Footer.tsx",
                                                lineNumber: 70,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 69,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 50,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/common/Footer.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-6 first:pt-0 sm:pt-0 text-center sm:text-left",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: HEADING_CLASS,
                                    children: t.contactInfo
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 79,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "space-y-3 text-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex justify-center sm:justify-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "📧"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/common/Footer.tsx",
                                                    lineNumber: 83,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "support@Tujitunze.com"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/common/Footer.tsx",
                                                    lineNumber: 84,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 82,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex justify-center sm:justify-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "📞"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/common/Footer.tsx",
                                                    lineNumber: 88,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "+255 617672872"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/common/Footer.tsx",
                                                    lineNumber: 89,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 87,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex justify-center sm:justify-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "📍"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/common/Footer.tsx",
                                                    lineNumber: 93,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: t.location
                                                }, void 0, false, {
                                                    fileName: "[project]/components/common/Footer.tsx",
                                                    lineNumber: 94,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 92,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 81,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-5 flex justify-center sm:justify-start gap-3",
                                    children: SOCIAL_LINKS.map((social)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            role: "button",
                                            "aria-label": social.label,
                                            className: "\n                  flex h-11 w-11 sm:h-9 sm:w-9\n                  items-center justify-center\n                  rounded-full\n                  border border-[#10B981]/40\n                  text-xs text-[#D1FAE5]\n                  cursor-pointer\n                  transition-colors duration-300 ease-in-out\n                  hover:border-[#10B981] hover:text-[#10B981]\n                ",
                                            children: social.glyph
                                        }, social.label, false, {
                                            fileName: "[project]/components/common/Footer.tsx",
                                            lineNumber: 100,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 98,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/common/Footer.tsx",
                            lineNumber: 78,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/common/Footer.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/common/Footer.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-t border-[#065F46] mt-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "\n          max-w-7xl\n          mx-auto\n          px-6\n          py-4\n          flex\n          flex-col\n          items-center\n          gap-3\n          text-center\n        ",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-[#9CA3AF]",
                            children: [
                                "© ",
                                new Date().getFullYear(),
                                " Tujitunze. ",
                                t.rightsReserved
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/common/Footer.tsx",
                            lineNumber: 138,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-center gap-6 sm:gap-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/privacy-policy",
                                    className: `${BOTTOM_LINK_CLASS} py-1`,
                                    children: t.privacyPolicy
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 143,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/terms",
                                    className: `${BOTTOM_LINK_CLASS} py-1`,
                                    children: t.terms
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Footer.tsx",
                                    lineNumber: 147,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/common/Footer.tsx",
                            lineNumber: 142,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/common/Footer.tsx",
                    lineNumber: 125,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/common/Footer.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/common/Footer.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/common/LanguageSwitcher.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LanguageSwitcher
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/common.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
// Language names are autonyms (each language's own name for itself), so
// they stay the same regardless of which language the rest of the UI is
// currently showing — this list is intentionally not run through the
// translation tables.
const LANGUAGE_OPTIONS = [
    {
        code: "sw",
        label: "Swahili",
        shortLabel: "SW"
    },
    {
        code: "en",
        label: "English",
        shortLabel: "EN"
    }
];
function LanguageSwitcher({ className = "" }) {
    const { language, setLanguage } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["commonTranslations"][language];
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const rootRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const current = LANGUAGE_OPTIONS.find((option)=>option.code === language) ?? LANGUAGE_OPTIONS[1];
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
    const handleSelect = (code)=>{
        setLanguage(code);
        setOpen(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: rootRef,
        className: `relative ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>setOpen((previous)=>!previous),
                "aria-label": t.changeLanguage,
                "aria-haspopup": "listbox",
                "aria-expanded": open,
                className: "\n        flex\n        w-full\n        items-center\n        justify-center\n        gap-2\n        border\n        border-gray-200\n        bg-white\n        text-gray-700\n        px-3 py-2\n        rounded-lg\n        text-sm\n        font-semibold\n        hover:border-blue-700\n        hover:text-blue-700\n        transition",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "hidden md:inline",
                        children: current.label
                    }, void 0, false, {
                        fileName: "[project]/components/common/LanguageSwitcher.tsx",
                        lineNumber: 91,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "md:hidden",
                        children: current.shortLabel
                    }, void 0, false, {
                        fileName: "[project]/components/common/LanguageSwitcher.tsx",
                        lineNumber: 92,
                        columnNumber: 9
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
                            fileName: "[project]/components/common/LanguageSwitcher.tsx",
                            lineNumber: 103,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/common/LanguageSwitcher.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/common/LanguageSwitcher.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                role: "listbox",
                "aria-label": t.changeLanguage,
                className: "\n          absolute\n          right-0\n          z-20\n          mt-2\n          w-44\n          overflow-hidden\n          rounded-lg\n          border\n          border-gray-100\n          bg-white\n          py-1\n          shadow-xl",
                children: LANGUAGE_OPTIONS.map((option)=>{
                    const isSelected = option.code === language;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        role: "option",
                        "aria-selected": isSelected,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>handleSelect(option.code),
                            className: `
                  flex
                  w-full
                  items-center
                  gap-2.5
                  px-4 py-2.5
                  text-left
                  text-sm
                  transition
                  ${isSelected ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-blue-700"}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: option.label
                            }, void 0, false, {
                                fileName: "[project]/components/common/LanguageSwitcher.tsx",
                                lineNumber: 152,
                                columnNumber: 19
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/common/LanguageSwitcher.tsx",
                            lineNumber: 134,
                            columnNumber: 17
                        }, this)
                    }, option.code, false, {
                        fileName: "[project]/components/common/LanguageSwitcher.tsx",
                        lineNumber: 133,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/components/common/LanguageSwitcher.tsx",
                lineNumber: 112,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/common/LanguageSwitcher.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/common/Sidebar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Sidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useAuth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/common.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$common$2f$LanguageSwitcher$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/common/LanguageSwitcher.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
function Sidebar({ roleLabel, navItems }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { firstName, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const [mobileOpen, setMobileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const navLabels = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["navLabelTranslations"][language];
    const roleLabels = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleLabelTranslations"][language];
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["commonTranslations"][language];
    // Close the drawer on route changes so a nav tap doesn't leave it open
    // behind the newly-loaded page.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMobileOpen(false);
    }, [
        pathname
    ]);
    const handleLogout = ()=>{
        setMobileOpen(false);
        logout();
        router.push("/login");
    };
    const sidebarBody = (onNavigate)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-6 py-6 border-b border-gray-100",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            onClick: onNavigate,
                            className: "text-xl font-bold text-blue-700",
                            children: "Tujitunze"
                        }, void 0, false, {
                            fileName: "[project]/components/common/Sidebar.tsx",
                            lineNumber: 52,
                            columnNumber: 9
                        }, this),
                        firstName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-3 truncate text-sm font-medium text-gray-700",
                            children: firstName
                        }, void 0, false, {
                            fileName: "[project]/components/common/Sidebar.tsx",
                            lineNumber: 60,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400",
                            children: roleLabels[roleLabel] ?? roleLabel
                        }, void 0, false, {
                            fileName: "[project]/components/common/Sidebar.tsx",
                            lineNumber: 64,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/common/Sidebar.tsx",
                    lineNumber: 51,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "flex-1 overflow-y-auto px-3 py-4 space-y-1",
                    children: navItems.map((item)=>{
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: item.href,
                            onClick: onNavigate,
                            className: `
              block
              rounded-lg
              px-3 py-2
              text-sm
              font-medium
              transition
              ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-blue-700"}`,
                            children: navLabels[item.labelKey] ?? item.labelKey
                        }, item.href, false, {
                            fileName: "[project]/components/common/Sidebar.tsx",
                            lineNumber: 76,
                            columnNumber: 13
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/components/common/Sidebar.tsx",
                    lineNumber: 69,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-3 py-4 border-t border-gray-100 space-y-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$common$2f$LanguageSwitcher$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            className: "w-full"
                        }, void 0, false, {
                            fileName: "[project]/components/common/Sidebar.tsx",
                            lineNumber: 101,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: handleLogout,
                            className: "w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-blue-700",
                            children: t.logOut
                        }, void 0, false, {
                            fileName: "[project]/components/common/Sidebar.tsx",
                            lineNumber: 102,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/common/Sidebar.tsx",
                    lineNumber: 100,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/common/Sidebar.tsx",
            lineNumber: 50,
            columnNumber: 5
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "text-lg font-bold text-blue-700",
                        children: "Tujitunze"
                    }, void 0, false, {
                        fileName: "[project]/components/common/Sidebar.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setMobileOpen(true),
                        "aria-label": t.openMenu,
                        "aria-expanded": mobileOpen,
                        className: "rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-700",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: 1.8,
                            "aria-hidden": "true",
                            className: "h-6 w-6",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                d: "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                            }, void 0, false, {
                                fileName: "[project]/components/common/Sidebar.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/common/Sidebar.tsx",
                            lineNumber: 131,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/common/Sidebar.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/common/Sidebar.tsx",
                lineNumber: 118,
                columnNumber: 7
            }, this),
            mobileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "md:hidden fixed inset-0 z-50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-black/40",
                        onClick: ()=>setMobileOpen(false)
                    }, void 0, false, {
                        fileName: "[project]/components/common/Sidebar.tsx",
                        lineNumber: 154,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-end px-3 pt-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setMobileOpen(false),
                                    "aria-label": t.closeMenu,
                                    className: "rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-700",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        xmlns: "http://www.w3.org/2000/svg",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: 1.8,
                                        "aria-hidden": "true",
                                        className: "h-6 w-6",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            d: "M6 18L18 6M6 6l12 12"
                                        }, void 0, false, {
                                            fileName: "[project]/components/common/Sidebar.tsx",
                                            lineNumber: 177,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/common/Sidebar.tsx",
                                        lineNumber: 168,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/common/Sidebar.tsx",
                                    lineNumber: 162,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/common/Sidebar.tsx",
                                lineNumber: 161,
                                columnNumber: 13
                            }, this),
                            sidebarBody(()=>setMobileOpen(false))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/common/Sidebar.tsx",
                        lineNumber: 159,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/common/Sidebar.tsx",
                lineNumber: 152,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-100 bg-white",
                children: sidebarBody()
            }, void 0, false, {
                fileName: "[project]/components/common/Sidebar.tsx",
                lineNumber: 194,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/common/Sidebar.tsx",
        lineNumber: 114,
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
"[project]/constants/translations/common.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "commonTranslations",
    ()=>commonTranslations,
    "navLabelTranslations",
    ()=>navLabelTranslations,
    "roleLabelTranslations",
    ()=>roleLabelTranslations
]);
const navLabelTranslations = {
    en: {
        dashboard: "Dashboard",
        members: "Members",
        auditLogs: "Audit Logs",
        auditSecurity: "Audit & Security",
        claims: "Claims",
        payments: "Payments",
        reports: "Reports",
        bankProfile: "Bank Profile",
        fundAccounts: "Fund Accounts",
        transactions: "Transactions",
        settlements: "Settlements",
        reconciliation: "Reconciliation",
        operatorProfile: "Operator Profile",
        registeredMembers: "Registered Members",
        contributionTransactions: "Contribution Transactions",
        resourceConversions: "Resource Conversions",
        outgoingDiversions: "Outgoing Diversions",
        contributionRules: "Contribution Rules",
        savingRules: "Saving Rules",
        administrators: "Administrators",
        rolesPermissions: "Roles & Permissions",
        financialReports: "Financial Reports"
    },
    sw: {
        dashboard: "Dashibodi",
        members: "Wanachama",
        auditLogs: "Kumbukumbu za Ukaguzi",
        auditSecurity: "Ukaguzi na Usalama",
        claims: "Madai",
        payments: "Malipo",
        reports: "Ripoti",
        bankProfile: "Wasifu wa Benki",
        fundAccounts: "Akaunti za Fedha",
        transactions: "Miamala",
        settlements: "Malipo ya Mrejesho",
        reconciliation: "Upatanisho",
        operatorProfile: "Wasifu wa Mtoa Huduma",
        registeredMembers: "Wanachama Waliosajiliwa",
        contributionTransactions: "Miamala ya Michango",
        resourceConversions: "Ubadilishaji wa Rasilimali",
        outgoingDiversions: "Uelekezaji wa Miamala ya Kutoka",
        contributionRules: "Kanuni za Michango",
        savingRules: "Kanuni za Akiba",
        administrators: "Wasimamizi",
        rolesPermissions: "Majukumu na Ruhusa",
        financialReports: "Ripoti za Fedha"
    }
};
const roleLabelTranslations = {
    en: {
        Member: "Member",
        Admin: "Admin",
        Insurance: "Insurance",
        Bank: "Bank",
        Telecom: "Telecom",
        "Super-admin": "Super-admin"
    },
    sw: {
        Member: "Mwanachama",
        Admin: "Msimamizi",
        Insurance: "Bima",
        Bank: "Benki",
        Telecom: "Simu",
        "Super-admin": "Msimamizi Mkuu"
    }
};
const commonTranslations = {
    en: {
        save: "Save",
        saving: "Saving...",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        submit: "Submit",
        submitting: "Submitting...",
        close: "Close",
        confirm: "Confirm",
        back: "Back",
        view: "View",
        loading: "Loading...",
        noDataFound: "No data found.",
        search: "Search...",
        filter: "Filter",
        status: "Status",
        actions: "Actions",
        logOut: "Log Out",
        backToDashboard: "Back to Dashboard",
        comingSoon: "Coming soon.",
        fieldRequired: "This field is required.",
        passwordsDontMatch: "Passwords do not match.",
        invalidFormat: "Invalid format.",
        somethingWentWrong: "Something went wrong. Please try again.",
        yes: "Yes",
        no: "No",
        notProvided: "Not provided",
        welcome: "Welcome",
        changeLanguage: "Change language",
        openMenu: "Open menu",
        closeMenu: "Close menu"
    },
    sw: {
        save: "Hifadhi",
        saving: "Inahifadhi...",
        cancel: "Ghairi",
        edit: "Hariri",
        delete: "Futa",
        submit: "Wasilisha",
        submitting: "Inawasilisha...",
        close: "Funga",
        confirm: "Thibitisha",
        back: "Rudi",
        view: "Angalia",
        loading: "Inapakia...",
        noDataFound: "Hakuna taarifa zilizopatikana.",
        search: "Tafuta...",
        filter: "Chuja",
        status: "Hali",
        actions: "Vitendo",
        logOut: "Toka",
        backToDashboard: "Rudi kwenye Dashibodi",
        comingSoon: "Inakuja hivi karibuni.",
        fieldRequired: "Sehemu hii inahitajika.",
        passwordsDontMatch: "Nywila hazifanani.",
        invalidFormat: "Muundo si sahihi.",
        somethingWentWrong: "Hitilafu imetokea. Tafadhali jaribu tena.",
        yes: "Ndiyo",
        no: "Hapana",
        notProvided: "Haijatolewa",
        welcome: "Karibu",
        changeLanguage: "Badilisha lugha",
        openMenu: "Fungua menyu",
        closeMenu: "Funga menyu"
    }
};
}),
"[project]/constants/translations/home.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "faqSectionTranslations",
    ()=>faqSectionTranslations,
    "footerTranslations",
    ()=>footerTranslations,
    "headerTranslations",
    ()=>headerTranslations,
    "heroTranslations",
    ()=>heroTranslations,
    "homeFaqsTranslations",
    ()=>homeFaqsTranslations,
    "servicesTranslations",
    ()=>servicesTranslations
]);
const headerTranslations = {
    en: {
        tagline: "Health Savings & Insurance Management System",
        home: "Home",
        about: "About",
        services: "Services",
        login: "Login",
        signUp: "Sign Up",
        getStarted: "Get Started",
        completeMembership: "Complete Membership",
        profile: "Profile",
        settings: "Settings",
        logOut: "Log Out"
    },
    sw: {
        tagline: "Mfumo wa Akiba ya Afya na Usimamizi wa Bima",
        home: "Nyumbani",
        about: "Kuhusu Sisi",
        services: "Huduma",
        login: "Ingia",
        signUp: "Jisajili",
        getStarted: "Anza Sasa",
        completeMembership: "Kamilisha Usajili",
        profile: "Wasifu",
        settings: "Mipangilio",
        logOut: "Toka"
    }
};
const heroTranslations = {
    en: {
        badge: "Health Savings & Insurance Management System",
        titleLine1: "Secure Your",
        titleHighlight: " Healthcare Future",
        description: "Tujitunze is a digital healthcare financial platform that enables members to save healthcare funds, contribute through telecom networks, verify membership status, and access healthcare services securely.",
        signUp: "Sign Up",
        login: "Login",
        getStarted: "Get Started with Tujitunze",
        whyChoose: "Why Choose Tujitunze?",
        feature1Title: "Health Wallet",
        feature1Description: "Save small amounts daily via mobile money — no bank account needed. Built for the mtu wa kawaida.",
        feature2Title: "Telecom Contributions",
        feature2Description: "Supports contributions through mobile networks.",
        feature3Title: "Bank Integration",
        feature3Description: "Connects securely with financial institutions."
    },
    sw: {
        badge: "Mfumo wa Akiba ya Afya na Usimamizi wa Bima",
        titleLine1: "Hakikisha",
        titleHighlight: " Afya Yako ya Baadaye",
        description: "Tujitunze ni jukwaa la kidijitali la fedha za afya linalowawezesha wanachama kuweka akiba ya matibabu, kuchangia kupitia mitandao ya simu, kuthibitisha uanachama, na kupata huduma za afya kwa usalama.",
        signUp: "Jisajili",
        login: "Ingia",
        getStarted: "Anza na Tujitunze",
        whyChoose: "Kwa Nini Uchague Tujitunze?",
        feature1Title: "Mkoba wa Afya",
        feature1Description: "Weka akiba kidogo kila siku kupitia pesa za simu — hauhitaji akaunti ya benki. Imeundwa kwa ajili ya mtu wa kawaida.",
        feature2Title: "Michango ya Simu",
        feature2Description: "Inasaidia michango kupitia mitandao ya simu.",
        feature3Title: "Uunganisho wa Benki",
        feature3Description: "Inaunganisha kwa usalama na taasisi za fedha."
    }
};
const servicesTranslations = {
    en: {
        heading: "Our Services",
        description: "HSIMS provides a complete healthcare financial ecosystem connecting members, telecom operators, banks, and healthcare providers.",
        learnMore: "Learn More →",
        telecomTitle: "Telecom Contributions",
        telecomDescription: "Tujitunze enables health contributions through Tanzania's telecom networks and telecom-related transactions and usage.",
        telecomMetaMember: "Member-first",
        telecomMetaRegion: "Tanzania",
        cards: [
            {
                title: "Health Savings Wallet",
                description: "Built for the mtu wa kawaida — save small amounts daily straight from mobile money, no bank account needed. One button to top up, one screen to check your balance."
            },
            {
                title: "Telecom Contributions",
                description: "Enables members to contribute through mobile networks such as Vodacom, Airtel, Tigo, Halotel, and TTCL."
            },
            {
                title: "Bank Integration",
                description: "Provides secure connection with bank accounts for healthcare financial transactions."
            }
        ]
    },
    sw: {
        heading: "Huduma Zetu",
        description: "HSIMS inatoa mfumo kamili wa fedha za afya unaounganisha wanachama, watoa huduma za simu, benki, na watoa huduma za afya.",
        learnMore: "Jifunze Zaidi →",
        telecomTitle: "Michango ya Simu",
        telecomDescription: "Tujitunze inawawezesha wanachama kuchangia kwa afya kupitia mitandao ya simu ya Tanzania na miamala na matumizi yanayohusiana na simu.",
        telecomMetaMember: "Kwa mwanachama",
        telecomMetaRegion: "Tanzania",
        cards: [
            {
                title: "Mkoba wa Akiba ya Afya",
                description: "Imeundwa kwa ajili ya mtu wa kawaida — weka akiba kidogo kila siku moja kwa moja kutoka kwa pesa za simu, hauhitaji akaunti ya benki. Kitufe kimoja kuongeza fedha, skrini moja kuangalia salio lako."
            },
            {
                title: "Michango ya Simu",
                description: "Inawawezesha wanachama kuchangia kupitia mitandao ya simu kama vile Vodacom, Airtel, Tigo, Halotel, na TTCL."
            },
            {
                title: "Uunganisho wa Benki",
                description: "Inatoa uunganisho salama na akaunti za benki kwa ajili ya miamala ya fedha za afya."
            }
        ]
    }
};
const faqSectionTranslations = {
    en: {
        title: "Frequently Asked Questions",
        description: "Answers to common questions about saving, contributing, and using Tujitunze."
    },
    sw: {
        title: "Maswali Yanayoulizwa Mara kwa Mara",
        description: "Majibu ya maswali ya kawaida kuhusu kuweka akiba, kuchangia, na kutumia Tujitunze."
    }
};
const homeFaqsTranslations = {
    en: [
        {
            question: "What is Tujitunze?",
            answer: "Tujitunze is a health savings and insurance management platform for Tanzania. It lets you save toward healthcare costs, contribute through your telecom or bank account, and access verified partner hospitals — all from one account."
        },
        {
            question: "Is Tujitunze free to use?",
            answer: "Creating an account and using the wallet, telecom contributions, and hospital verification features is free. Any transaction or contribution fees are shown clearly before you confirm, so there are never hidden charges."
        },
        {
            question: "How do I add money to my wallet?",
            answer: "You can top up your Tujitunze wallet through mobile money with Vodacom, Airtel, Yas Money, Halotel, or TTCL, or by linking a supported bank account directly from your dashboard."
        },
        {
            question: "Do I need a bank account to use Tujitunze?",
            answer: "No. The wallet is built for the mtu wa kawaida — the ordinary person. Mobile money is enough to save small amounts daily; a bank account is only an extra option for members who prefer one."
        },
        {
            question: "Can hospitals verify my membership?",
            answer: "Yes. Partner hospitals can verify your active membership at the point of care, so you don't need to carry paperwork — your account status is checked instantly."
        },
        {
            question: "Is my personal information secure?",
            answer: "Yes. Tujitunze uses authenticated, role-based access to protect your account, and your NIDA and financial details are only used to verify your identity and manage your own savings and coverage."
        }
    ],
    sw: [
        {
            question: "Tujitunze ni nini?",
            answer: "Tujitunze ni jukwaa la akiba ya afya na usimamizi wa bima kwa Tanzania. Linakuwezesha kuweka akiba kwa ajili ya gharama za matibabu, kuchangia kupitia simu au akaunti ya benki, na kupata hospitali washirika zilizothibitishwa — yote kutoka akaunti moja."
        },
        {
            question: "Je, Tujitunze ni bure kutumia?",
            answer: "Kufungua akaunti na kutumia mkoba, michango ya simu, na uthibitisho wa hospitali ni bure. Ada zozote za miamala au michango zinaonyeshwa wazi kabla ya kuthibitisha, hivyo hakuna gharama za siri."
        },
        {
            question: "Ninawezaje kuweka fedha kwenye mkoba wangu?",
            answer: "Unaweza kuongeza fedha kwenye mkoba wako wa Tujitunze kupitia pesa za simu za Vodacom, Airtel, Yas Money, Halotel, au TTCL, au kwa kuunganisha akaunti ya benki inayotumika moja kwa moja kutoka dashibodi yako."
        },
        {
            question: "Je, nahitaji akaunti ya benki kutumia Tujitunze?",
            answer: "Hapana. Mkoba umeundwa kwa ajili ya mtu wa kawaida. Pesa za simu zinatosha kuweka akiba kidogo kila siku; akaunti ya benki ni chaguo la ziada tu kwa wanachama wanaopendelea."
        },
        {
            question: "Je, hospitali zinaweza kuthibitisha uanachama wangu?",
            answer: "Ndiyo. Hospitali washirika zinaweza kuthibitisha uanachama wako ulio hai wakati wa huduma, hivyo hauhitaji kubeba nyaraka — hali ya akaunti yako inakaguliwa papo hapo."
        },
        {
            question: "Je, taarifa zangu binafsi ziko salama?",
            answer: "Ndiyo. Tujitunze hutumia ufikiaji wenye uthibitisho na unaozingatia jukumu kulinda akaunti yako, na taarifa zako za NIDA na fedha hutumika tu kuthibitisha utambulisho wako na kusimamia akiba na huduma zako mwenyewe."
        }
    ]
};
const footerTranslations = {
    en: {
        description: "Health Savings and Insurance Management System. A secure digital platform connecting members, healthcare providers, telecom networks, and financial institutions.",
        navigation: "Navigation",
        home: "Home",
        about: "About Us",
        services: "Services",
        contact: "Contact",
        ourServices: "Our Services",
        service1: "Health Savings Wallet",
        service2: "Telecom Contributions",
        service3: "NIDA Member Verification",
        service5: "Bank Account Integration",
        contactInfo: "Contact Information",
        location: "Tanzania",
        rightsReserved: "All rights reserved.",
        privacyPolicy: "Privacy Policy",
        terms: "Terms & Conditions"
    },
    sw: {
        description: "Mfumo wa Akiba ya Afya na Usimamizi wa Bima. Jukwaa salama la kidijitali linaunganisha wanachama, watoa huduma za afya, mitandao ya simu, na taasisi za fedha.",
        navigation: "Uelekezaji",
        home: "Nyumbani",
        about: "Kuhusu Sisi",
        services: "Huduma",
        contact: "Wasiliana Nasi",
        ourServices: "Huduma Zetu",
        service1: "Mkoba wa Akiba ya Afya",
        service2: "Michango ya Simu",
        service3: "Uthibitisho wa Uanachama wa NIDA",
        service5: "Uunganisho wa Akaunti ya Benki",
        contactInfo: "Taarifa za Mawasiliano",
        location: "Tanzania",
        rightsReserved: "Haki zote zimehifadhiwa.",
        privacyPolicy: "Sera ya Faragha",
        terms: "Vigezo na Masharti"
    }
};
}),
"[project]/lib/hooks/useAuth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/permissions.ts [app-ssr] (ecmascript)");
"use client";
;
;
function useAuth() {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        userId: null,
        roles: [],
        firstName: null,
        isAuthenticated: false,
        isLoading: true
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAccessToken"])();
        const payload = token ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["decodeAccessToken"])(token) : null;
        const storedUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredAuthUser"])();
        if (!payload || (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isTokenExpired"])(payload)) {
            setState({
                userId: null,
                roles: [],
                firstName: storedUser?.firstName ?? null,
                isAuthenticated: false,
                isLoading: false
            });
            return;
        }
        setState({
            userId: payload.sub,
            roles: payload.roles,
            firstName: payload.firstName || storedUser?.firstName || null,
            isAuthenticated: true,
            isLoading: false
        });
    }, []);
    const logout = ()=>{
        localStorage.removeItem(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ACCESS_TOKEN_STORAGE_KEY"]);
        localStorage.removeItem(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AUTH_USER_STORAGE_KEY"]);
        setState({
            userId: null,
            roles: [],
            firstName: null,
            isAuthenticated: false,
            isLoading: false
        });
    };
    return {
        ...state,
        logout
    };
}
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

//# sourceMappingURL=_02-a-q3._.js.map