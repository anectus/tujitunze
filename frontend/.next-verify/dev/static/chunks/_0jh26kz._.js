(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/auth/FormField.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FormField
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function FormField({ id, name, label, type = "text", value, onChange, onBlur, placeholder, autoComplete, inputMode, maxLength, optionalLabel, error, valid, helpText, trailing }) {
    const showCheck = !trailing && valid && !error;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            label && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: id,
                className: "mb-2 block text-sm font-semibold text-gray-700",
                children: [
                    label,
                    optionalLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                    trailing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-y-0 right-0 flex items-center pr-3",
                        children: trailing
                    }, void 0, false, {
                        fileName: "[project]/components/auth/FormField.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this) : showCheck ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-y-0 right-0 flex items-center pr-3 text-[#10B981]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            xmlns: "http://www.w3.org/2000/svg",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: 2,
                            className: "h-5 w-5",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
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
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-xs text-red-600",
                children: error
            }, void 0, false, {
                fileName: "[project]/components/auth/FormField.tsx",
                lineNumber: 111,
                columnNumber: 9
            }, this) : helpText ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
_c = FormField;
var _c;
__turbopack_context__.k.register(_c, "FormField");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/auth/RegisterForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RegisterForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$nida$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/nida.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$formatPhone$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/formatPhone.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/context/LanguageContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/constants/translations/common.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/FormField.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$Spinner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/Spinner.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function SectionHeading({ index, title }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-xs font-bold text-white",
                children: index
            }, void 0, false, {
                fileName: "[project]/components/auth/RegisterForm.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-lg font-semibold text-[#064E3B]",
                children: title
            }, void 0, false, {
                fileName: "[project]/components/auth/RegisterForm.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/auth/RegisterForm.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_c = SectionHeading;
function RegisterForm() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { language } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLanguage"])();
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["registerFormTranslations"][language];
    const common = __TURBOPACK__imported__module__$5b$project$5d2f$constants$2f$translations$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["commonTranslations"][language];
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        firstName: "",
        secondName: "",
        surname: "",
        phoneNumber: "",
        nidaNumber: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [fieldErrors, setFieldErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [touched, setTouched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [showMoreDetails, setShowMoreDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const validateField = (field, value, passwordValue)=>{
        switch(field){
            case "firstName":
                return value.trim() ? undefined : t.firstNameRequired;
            case "surname":
                return value.trim() ? undefined : t.surnameRequired;
            case "phoneNumber":
                if (!value.trim()) return t.phoneNumberRequired;
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$formatPhone$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidTanzanianPhoneNumber"])(value) ? undefined : t.phoneNumberInvalid;
            case "nidaNumber":
                if (!value.trim()) return t.nidaNumberRequired;
                return value.length === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$nida$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NIDA_FORMATTED_LENGTH"] ? undefined : t.nidaNumberIncomplete;
            case "email":
                if (!value.trim()) return undefined; // optional field
                return EMAIL_PATTERN.test(value) ? undefined : t.emailInvalid;
            case "password":
                if (!value) return t.passwordRequired;
                return value.length >= 8 ? undefined : t.passwordTooShort;
            case "confirmPassword":
                if (!value) return t.confirmPasswordRequired;
                return value === passwordValue ? undefined : common.passwordsDontMatch;
            default:
                return undefined;
        }
    };
    const handleChange = (e)=>{
        const { name, value } = e.target;
        const field = name;
        const nextFormData = {
            ...formData,
            [name]: value
        };
        setFormData(nextFormData);
        setFieldErrors((previous)=>{
            const next = {
                ...previous
            };
            if (touched[field]) {
                next[field] = validateField(field, value, nextFormData.password);
            }
            // Re-check confirmPassword live whenever password changes, since
            // its validity depends on the other field's value.
            if (field === "password" && touched.confirmPassword) {
                next.confirmPassword = validateField("confirmPassword", nextFormData.confirmPassword, value);
            }
            return next;
        });
        setError("");
        setSuccess("");
    };
    // NIDA number — the user only types digits; the dashes (8-5-5-2) are
    // inserted automatically as they type.
    const handleNidaChange = (e)=>{
        const formatted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$nida$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNidaNumber"])(e.target.value);
        setFormData((previousData)=>({
                ...previousData,
                nidaNumber: formatted
            }));
        if (touched.nidaNumber) {
            setFieldErrors((previous)=>({
                    ...previous,
                    nidaNumber: validateField("nidaNumber", formatted, formData.password)
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
                [field]: validateField(field, value, formData.password)
            }));
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        const fieldsToValidate = [
            "firstName",
            "surname",
            "phoneNumber",
            "nidaNumber",
            "email",
            "password",
            "confirmPassword"
        ];
        const nextErrors = {};
        fieldsToValidate.forEach((field)=>{
            nextErrors[field] = validateField(field, formData[field], formData.password);
        });
        setFieldErrors(nextErrors);
        setTouched({
            firstName: true,
            surname: true,
            phoneNumber: true,
            nidaNumber: true,
            email: true,
            password: true,
            confirmPassword: true
        });
        // Email only lives behind "Add more details" — if it's invalid, the
        // member needs to see the section that contains it.
        if (nextErrors.email && !showMoreDetails) {
            setShowMoreDetails(true);
        }
        if (Object.values(nextErrors).some(Boolean)) {
            return;
        }
        setError("");
        setSuccess("");
        try {
            setLoading(true);
            const response = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_URL"]}/members/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    secondName: formData.secondName || undefined,
                    surname: formData.surname,
                    phoneNumber: formData.phoneNumber,
                    nidaNumber: formData.nidaNumber,
                    email: formData.email || undefined,
                    password: formData.password
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || t.errorFallback);
            }
            setSuccess(t.successMessage);
            setFormData({
                firstName: "",
                secondName: "",
                surname: "",
                phoneNumber: "",
                nidaNumber: "",
                email: "",
                password: "",
                confirmPassword: ""
            });
            setFieldErrors({});
            setTouched({});
            setTimeout(()=>{
                router.push("/login");
            }, 1500);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(common.somethingWentWrong);
            }
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-white px-4 py-12",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-2xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "text-2xl font-bold text-[#064E3B] tracking-tight",
                            children: "Tujitunze"
                        }, void 0, false, {
                            fileName: "[project]/components/auth/RegisterForm.tsx",
                            lineNumber: 277,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "mt-6 text-3xl font-bold text-gray-900",
                            children: t.title
                        }, void 0, false, {
                            fileName: "[project]/components/auth/RegisterForm.tsx",
                            lineNumber: 284,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-2 text-sm text-gray-600",
                            children: t.subtitle
                        }, void 0, false, {
                            fileName: "[project]/components/auth/RegisterForm.tsx",
                            lineNumber: 288,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/auth/RegisterForm.tsx",
                    lineNumber: 275,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10",
                    children: [
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/components/auth/RegisterForm.tsx",
                            lineNumber: 299,
                            columnNumber: 13
                        }, this),
                        success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-[#064E3B]",
                            children: success
                        }, void 0, false, {
                            fileName: "[project]/components/auth/RegisterForm.tsx",
                            lineNumber: 306,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleSubmit,
                            className: "space-y-8",
                            noValidate: true,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionHeading, {
                                            index: 1,
                                            title: t.sectionPersonalInfo
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 320,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 sm:grid-cols-2 gap-5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    id: "firstName",
                                                    name: "firstName",
                                                    label: t.firstName,
                                                    value: formData.firstName,
                                                    onChange: handleChange,
                                                    onBlur: handleBlur,
                                                    placeholder: t.firstNamePlaceholder,
                                                    autoComplete: "given-name",
                                                    error: fieldErrors.firstName,
                                                    valid: touched.firstName && !!formData.firstName.trim()
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                                    lineNumber: 323,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    id: "surname",
                                                    name: "surname",
                                                    label: t.surname,
                                                    value: formData.surname,
                                                    onChange: handleChange,
                                                    onBlur: handleBlur,
                                                    placeholder: t.surnamePlaceholder,
                                                    autoComplete: "family-name",
                                                    error: fieldErrors.surname,
                                                    valid: touched.surname && !!formData.surname.trim()
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                                    lineNumber: 336,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 322,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            id: "phoneNumber",
                                            name: "phoneNumber",
                                            label: t.phoneNumber,
                                            type: "tel",
                                            value: formData.phoneNumber,
                                            onChange: handleChange,
                                            onBlur: handleBlur,
                                            placeholder: t.phoneNumberPlaceholder,
                                            autoComplete: "tel",
                                            error: fieldErrors.phoneNumber,
                                            valid: touched.phoneNumber && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$formatPhone$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidTanzanianPhoneNumber"])(formData.phoneNumber),
                                            helpText: t.phoneNumberHelp
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 350,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            id: "nidaNumber",
                                            name: "nidaNumber",
                                            label: t.nidaNumber,
                                            inputMode: "numeric",
                                            value: formData.nidaNumber,
                                            onChange: handleNidaChange,
                                            onBlur: handleBlur,
                                            placeholder: t.nidaNumberPlaceholder,
                                            maxLength: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$nida$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NIDA_FORMATTED_LENGTH"],
                                            error: fieldErrors.nidaNumber,
                                            valid: touched.nidaNumber && formData.nidaNumber.length === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$nida$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NIDA_FORMATTED_LENGTH"],
                                            helpText: t.nidaNumberHelp
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 365,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setShowMoreDetails((visible)=>!visible),
                                            className: "text-sm font-semibold text-[#064E3B] hover:text-[#065F46] transition-colors duration-300 ease-in-out",
                                            children: showMoreDetails ? t.showLessDetails : t.addMoreDetails
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 380,
                                            columnNumber: 15
                                        }, this),
                                        showMoreDetails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 sm:grid-cols-2 gap-5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    id: "secondName",
                                                    name: "secondName",
                                                    label: t.secondName,
                                                    optionalLabel: t.optional,
                                                    value: formData.secondName,
                                                    onChange: handleChange,
                                                    placeholder: t.secondNamePlaceholder,
                                                    autoComplete: "additional-name"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    id: "email",
                                                    name: "email",
                                                    label: t.email,
                                                    type: "email",
                                                    optionalLabel: t.optional,
                                                    value: formData.email,
                                                    onChange: handleChange,
                                                    onBlur: handleBlur,
                                                    placeholder: t.emailPlaceholder,
                                                    autoComplete: "email",
                                                    error: fieldErrors.email,
                                                    valid: touched.email && !!formData.email.trim() && EMAIL_PATTERN.test(formData.email)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                                    lineNumber: 401,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 389,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                    lineNumber: 319,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-5 border-t border-gray-200 pt-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionHeading, {
                                            index: 2,
                                            title: t.sectionAccountSetup
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 421,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            id: "password",
                                            name: "password",
                                            label: t.password,
                                            type: "password",
                                            value: formData.password,
                                            onChange: handleChange,
                                            onBlur: handleBlur,
                                            placeholder: t.passwordPlaceholder,
                                            autoComplete: "new-password",
                                            error: fieldErrors.password,
                                            helpText: t.passwordHelp
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 423,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            id: "confirmPassword",
                                            name: "confirmPassword",
                                            label: t.confirmPassword,
                                            type: "password",
                                            value: formData.confirmPassword,
                                            onChange: handleChange,
                                            onBlur: handleBlur,
                                            placeholder: t.confirmPasswordPlaceholder,
                                            autoComplete: "new-password",
                                            error: fieldErrors.confirmPassword
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 437,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                    lineNumber: 420,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-5 border-t border-gray-200 pt-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionHeading, {
                                            index: 3,
                                            title: t.sectionAgreement
                                        }, void 0, false, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 453,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    id: "terms",
                                                    type: "checkbox",
                                                    required: true,
                                                    className: "mt-1 h-4 w-4 rounded border-gray-300\n                  text-[#064E3B] focus:ring-[#064E3B]"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                                    lineNumber: 457,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "terms",
                                                    className: "text-sm leading-5 text-gray-600",
                                                    children: t.termsLabel
                                                }, void 0, false, {
                                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                                    lineNumber: 465,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 455,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "submit",
                                            disabled: loading,
                                            className: "w-full flex items-center justify-center gap-2 rounded-lg bg-[#064E3B] px-6 py-3.5\n                text-lg font-semibold text-white transition-colors duration-300 ease-in-out\n                hover:bg-[#065F46] disabled:cursor-not-allowed\n                disabled:opacity-60",
                                            children: [
                                                loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$Spinner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                                    lineNumber: 483,
                                                    columnNumber: 29
                                                }, this),
                                                loading ? t.submitting : t.submit
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/auth/RegisterForm.tsx",
                                            lineNumber: 475,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/auth/RegisterForm.tsx",
                                    lineNumber: 452,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/auth/RegisterForm.tsx",
                            lineNumber: 312,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-8 text-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-600",
                                children: [
                                    t.alreadyHaveAccount,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/login",
                                        className: "font-semibold text-[#064E3B]\n                hover:text-[#065F46] hover:underline",
                                        children: t.login
                                    }, void 0, false, {
                                        fileName: "[project]/components/auth/RegisterForm.tsx",
                                        lineNumber: 496,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/auth/RegisterForm.tsx",
                                lineNumber: 493,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/auth/RegisterForm.tsx",
                            lineNumber: 491,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/auth/RegisterForm.tsx",
                    lineNumber: 295,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-6 text-center text-sm text-gray-500",
                    children: t.copyright
                }, void 0, false, {
                    fileName: "[project]/components/auth/RegisterForm.tsx",
                    lineNumber: 510,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/auth/RegisterForm.tsx",
            lineNumber: 272,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/auth/RegisterForm.tsx",
        lineNumber: 270,
        columnNumber: 5
    }, this);
}
_s(RegisterForm, "ycR5Mzaija7NGlQK45GcCOEsbV0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$context$2f$LanguageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLanguage"]
    ];
});
_c1 = RegisterForm;
var _c, _c1;
__turbopack_context__.k.register(_c, "SectionHeading");
__turbopack_context__.k.register(_c1, "RegisterForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/auth/Spinner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Spinner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Spinner() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "h-5 w-5 animate-spin text-white",
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
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
_c = Spinner;
var _c;
__turbopack_context__.k.register(_c, "Spinner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/constants/translations/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/constants/translations/common.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/utils/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "API_URL",
    ()=>API_URL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
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
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL;
    }
    if ("TURBOPACK compile-time truthy", 1) {
        return `${window.location.protocol}//${window.location.hostname}:3012`;
    }
    //TURBOPACK unreachable
    ;
}
const API_URL = resolveApiUrl();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/utils/formatPhone.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Tanzanian mobile numbers: accepted as 0712345678 / 255712345678 /
// +255712345678, all identified by the same 3-digit prefix once
// normalized to local format. Mirrors
// MembersService.normalizeTanzanianPhone on the backend, but this is
// only used for the live "which network is this" hint as the member
// types — the backend re-derives and validates the real prefix itself.
__turbopack_context__.s([
    "detectTelecomOperator",
    ()=>detectTelecomOperator,
    "isValidTanzanianPhoneNumber",
    ()=>isValidTanzanianPhoneNumber,
    "normalizeTanzanianPhonePrefix",
    ()=>normalizeTanzanianPhonePrefix
]);
function normalizeTanzanianPhonePrefix(raw) {
    let phoneNumber = raw.trim().replace(/\s+/g, "");
    if (phoneNumber.startsWith("+255")) {
        phoneNumber = "0" + phoneNumber.slice(4);
    } else if (phoneNumber.startsWith("255")) {
        phoneNumber = "0" + phoneNumber.slice(3);
    }
    if (phoneNumber.length < 3 || !/^0\d+$/.test(phoneNumber)) {
        return null;
    }
    return phoneNumber.slice(0, 3);
}
function isValidTanzanianPhoneNumber(raw) {
    let phoneNumber = raw.trim().replace(/\s+/g, "");
    if (phoneNumber.startsWith("+255")) {
        phoneNumber = "0" + phoneNumber.slice(4);
    } else if (phoneNumber.startsWith("255")) {
        phoneNumber = "0" + phoneNumber.slice(3);
    }
    return /^0\d{9}$/.test(phoneNumber);
}
function detectTelecomOperator(phoneNumber, operators) {
    const prefix = normalizeTanzanianPhonePrefix(phoneNumber);
    if (!prefix) {
        return null;
    }
    return operators.find((operator)=>operator.prefixes.includes(prefix)) ?? null;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/utils/nida.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    default: null,
    useLinkStatus: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    /**
 * A React component that extends the HTML `<a>` element to provide
 * [prefetching](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching)
 * and client-side navigation. This is the primary way to navigate between routes in Next.js.
 *
 * @remarks
 * - Prefetching is only enabled in production.
 *
 * @see https://nextjs.org/docs/app/api-reference/components/link
 */ default: function() {
        return LinkComponent;
    },
    useLinkStatus: function() {
        return useLinkStatus;
    }
});
const _interop_require_wildcard = __turbopack_context__.r("[project]/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs [app-client] (ecmascript)");
const _jsxruntime = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
const _react = /*#__PURE__*/ _interop_require_wildcard._(__turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"));
const _formaturl = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/router/utils/format-url.js [app-client] (ecmascript)");
const _approutercontextsharedruntime = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)");
const _usemergedref = __turbopack_context__.r("[project]/node_modules/next/dist/client/use-merged-ref.js [app-client] (ecmascript)");
const _utils = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils.js [app-client] (ecmascript)");
const _addbasepath = __turbopack_context__.r("[project]/node_modules/next/dist/client/add-base-path.js [app-client] (ecmascript)");
const _routerreducertypes = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/router-reducer/router-reducer-types.js [app-client] (ecmascript)");
const _links = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/links.js [app-client] (ecmascript)");
const _islocalurl = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/router/utils/is-local-url.js [app-client] (ecmascript)");
const _types = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/segment-cache/types.js [app-client] (ecmascript)");
function isModifiedEvent(event) {
    const eventTarget = event.currentTarget;
    const target = eventTarget.getAttribute('target');
    return target && target !== '_self' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || // triggers resource download
    event.nativeEvent && event.nativeEvent.which === 2;
}
function linkClicked(e, href, linkInstanceRef, replace, scroll, onNavigate, transitionTypes, prefetchIntent = 'none') {
    if (typeof window !== 'undefined') {
        const { nodeName } = e.currentTarget;
        // anchors inside an svg have a lowercase nodeName
        const isAnchorNodeName = nodeName.toUpperCase() === 'A';
        if (isAnchorNodeName && isModifiedEvent(e) || e.currentTarget.hasAttribute('download')) {
            // ignore click for browser’s default behavior
            return;
        }
        if (!(0, _islocalurl.isLocalURL)(href)) {
            if (replace) {
                // browser default behavior does not replace the history state
                // so we need to do it manually
                e.preventDefault();
                location.replace(href);
            }
            // ignore click for browser’s default behavior
            return;
        }
        e.preventDefault();
        if (onNavigate) {
            let isDefaultPrevented = false;
            onNavigate({
                preventDefault: ()=>{
                    isDefaultPrevented = true;
                }
            });
            if (isDefaultPrevented) {
                return;
            }
        }
        const { dispatchNavigateAction } = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/app-router-instance.js [app-client] (ecmascript)");
        _react.default.startTransition(()=>{
            dispatchNavigateAction(href, replace ? 'replace' : 'push', scroll === false ? _routerreducertypes.ScrollBehavior.NoScroll : _routerreducertypes.ScrollBehavior.Default, linkInstanceRef.current, transitionTypes, prefetchIntent);
        });
    }
}
function formatStringOrUrl(urlObjOrString) {
    if (typeof urlObjOrString === 'string') {
        return urlObjOrString;
    }
    return (0, _formaturl.formatUrl)(urlObjOrString);
}
function LinkComponent(props) {
    const [linkStatus, setOptimisticLinkStatus] = (0, _react.useOptimistic)(_links.IDLE_LINK_STATUS);
    let children;
    const linkInstanceRef = (0, _react.useRef)(null);
    const { href: hrefProp, as: asProp, children: childrenProp, prefetch: prefetchProp = null, passHref, replace, shallow, scroll, onClick, onMouseEnter: onMouseEnterProp, onTouchStart: onTouchStartProp, legacyBehavior = false, onNavigate, transitionTypes, ref: forwardedRef, unstable_dynamicOnHover, ...restProps } = props;
    children = childrenProp;
    if (legacyBehavior && (typeof children === 'string' || typeof children === 'number')) {
        children = /*#__PURE__*/ (0, _jsxruntime.jsx)("a", {
            children: children
        });
    }
    const router = _react.default.useContext(_approutercontextsharedruntime.AppRouterContext);
    const prefetchEnabled = prefetchProp !== false;
    const prefetchIntent = prefetchProp === false ? 'none' : prefetchProp === true ? 'full' : 'auto';
    const fetchStrategy = prefetchIntent !== 'none' ? getFetchStrategyFromPrefetchIntent(prefetchIntent) : _types.FetchStrategy.PPR;
    if ("TURBOPACK compile-time truthy", 1) {
        function createPropError(args) {
            return Object.defineProperty(new Error(`Failed prop type: The prop \`${args.key}\` expects a ${args.expected} in \`<Link>\`, but got \`${args.actual}\` instead.` + (typeof window !== 'undefined' ? "\nOpen your browser's console to view the Component stack trace." : '')), "__NEXT_ERROR_CODE", {
                value: "E319",
                enumerable: false,
                configurable: true
            });
        }
        // TypeScript trick for type-guarding:
        const requiredPropsGuard = {
            href: true
        };
        const requiredProps = Object.keys(requiredPropsGuard);
        requiredProps.forEach((key)=>{
            if (key === 'href') {
                if (props[key] == null || typeof props[key] !== 'string' && typeof props[key] !== 'object') {
                    throw createPropError({
                        key,
                        expected: '`string` or `object`',
                        actual: props[key] === null ? 'null' : typeof props[key]
                    });
                }
            } else {
                // TypeScript trick for type-guarding:
                const _ = key;
            }
        });
        // TypeScript trick for type-guarding:
        const optionalPropsGuard = {
            as: true,
            replace: true,
            scroll: true,
            shallow: true,
            passHref: true,
            prefetch: true,
            unstable_dynamicOnHover: true,
            onClick: true,
            onMouseEnter: true,
            onTouchStart: true,
            legacyBehavior: true,
            onNavigate: true,
            transitionTypes: true
        };
        const optionalProps = Object.keys(optionalPropsGuard);
        optionalProps.forEach((key)=>{
            const valType = typeof props[key];
            if (key === 'as') {
                if (props[key] && valType !== 'string' && valType !== 'object') {
                    throw createPropError({
                        key,
                        expected: '`string` or `object`',
                        actual: valType
                    });
                }
            } else if (key === 'onClick' || key === 'onMouseEnter' || key === 'onTouchStart' || key === 'onNavigate') {
                if (props[key] && valType !== 'function') {
                    throw createPropError({
                        key,
                        expected: '`function`',
                        actual: valType
                    });
                }
            } else if (key === 'replace' || key === 'scroll' || key === 'shallow' || key === 'passHref' || key === 'legacyBehavior' || key === 'unstable_dynamicOnHover') {
                if (props[key] != null && valType !== 'boolean') {
                    throw createPropError({
                        key,
                        expected: '`boolean`',
                        actual: valType
                    });
                }
            } else if (key === 'prefetch') {
                if (props[key] != null && valType !== 'boolean' && props[key] !== 'auto') {
                    throw createPropError({
                        key,
                        expected: '`boolean | "auto"`',
                        actual: valType
                    });
                }
            } else if (key === 'transitionTypes') {
                if (props[key] != null && !Array.isArray(props[key])) {
                    throw createPropError({
                        key,
                        expected: '`string[]`',
                        actual: valType
                    });
                }
            } else {
                // TypeScript trick for type-guarding:
                const _ = key;
            }
        });
    }
    const resolvedHref = asProp || hrefProp;
    const formattedHref = formatStringOrUrl(resolvedHref);
    if ("TURBOPACK compile-time truthy", 1) {
        const { warnOnce } = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils/warn-once.js [app-client] (ecmascript)");
        if (props.locale) {
            warnOnce('The `locale` prop is not supported in `next/link` while using the `app` router. Read more about app router internalization: https://nextjs.org/docs/app/building-your-application/routing/internationalization');
        }
        if (!asProp) {
            let href;
            if (typeof resolvedHref === 'string') {
                href = resolvedHref;
            } else if (typeof resolvedHref === 'object' && typeof resolvedHref.pathname === 'string') {
                href = resolvedHref.pathname;
            }
            if (href) {
                const hasDynamicSegment = href.split('/').some((segment)=>segment.startsWith('[') && segment.endsWith(']'));
                if (hasDynamicSegment) {
                    throw Object.defineProperty(new Error(`Dynamic href \`${href}\` found in <Link> while using the \`/app\` router, this is not supported. Read more: https://nextjs.org/docs/messages/app-dir-dynamic-href`), "__NEXT_ERROR_CODE", {
                        value: "E267",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
        }
    }
    // This will return the first child, if multiple are provided it will throw an error
    let child;
    if (legacyBehavior) {
        if (children?.$$typeof === Symbol.for('react.lazy')) {
            throw Object.defineProperty(new Error(`\`<Link legacyBehavior>\` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's \`<a>\` tag.`), "__NEXT_ERROR_CODE", {
                value: "E863",
                enumerable: false,
                configurable: true
            });
        }
        if ("TURBOPACK compile-time truthy", 1) {
            if (onClick) {
                console.warn(`"onClick" was passed to <Link> with \`href\` of \`${formattedHref}\` but "legacyBehavior" was set. The legacy behavior requires onClick be set on the child of next/link`);
            }
            if (onMouseEnterProp) {
                console.warn(`"onMouseEnter" was passed to <Link> with \`href\` of \`${formattedHref}\` but "legacyBehavior" was set. The legacy behavior requires onMouseEnter be set on the child of next/link`);
            }
            try {
                child = _react.default.Children.only(children);
            } catch (err) {
                if (!children) {
                    throw Object.defineProperty(new Error(`No children were passed to <Link> with \`href\` of \`${formattedHref}\` but one child is required https://nextjs.org/docs/messages/link-no-children`), "__NEXT_ERROR_CODE", {
                        value: "E320",
                        enumerable: false,
                        configurable: true
                    });
                }
                throw Object.defineProperty(new Error(`Multiple children were passed to <Link> with \`href\` of \`${formattedHref}\` but only one child is supported https://nextjs.org/docs/messages/link-multiple-children` + (typeof window !== 'undefined' ? " \nOpen your browser's console to view the Component stack trace." : '')), "__NEXT_ERROR_CODE", {
                    value: "E266",
                    enumerable: false,
                    configurable: true
                });
            }
        } else //TURBOPACK unreachable
        ;
    } else {
        if ("TURBOPACK compile-time truthy", 1) {
            if (children?.type === 'a') {
                throw Object.defineProperty(new Error('Invalid <Link> with <a> child. Please remove <a> or use <Link legacyBehavior>.\nLearn more: https://nextjs.org/docs/messages/invalid-new-link-with-extra-anchor'), "__NEXT_ERROR_CODE", {
                    value: "E209",
                    enumerable: false,
                    configurable: true
                });
            }
        }
    }
    const childRef = legacyBehavior ? child && typeof child === 'object' && child.ref : forwardedRef;
    // Capture the Owner Stack during render so dev-only warnings emitted later
    // at navigation time can be associated with the JSX that created
    // this <Link>.
    const ownerStack = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : undefined;
    // Use a callback ref to attach an IntersectionObserver to the anchor tag on
    // mount. In the future we will also use this to keep track of all the
    // currently mounted <Link> instances, e.g. so we can re-prefetch them after
    // a revalidation or refresh.
    const observeLinkVisibilityOnMount = _react.default.useCallback({
        "LinkComponent.useCallback[observeLinkVisibilityOnMount]": (element)=>{
            if (router !== null) {
                linkInstanceRef.current = (0, _links.mountLinkInstance)(element, formattedHref, router, fetchStrategy, prefetchEnabled, setOptimisticLinkStatus, ownerStack);
            }
            return ({
                "LinkComponent.useCallback[observeLinkVisibilityOnMount]": ()=>{
                    if (linkInstanceRef.current) {
                        (0, _links.unmountLinkForCurrentNavigation)(linkInstanceRef.current);
                        linkInstanceRef.current = null;
                    }
                    (0, _links.unmountPrefetchableInstance)(element);
                }
            })["LinkComponent.useCallback[observeLinkVisibilityOnMount]"];
        }
    }["LinkComponent.useCallback[observeLinkVisibilityOnMount]"], [
        prefetchEnabled,
        formattedHref,
        router,
        fetchStrategy,
        setOptimisticLinkStatus,
        ownerStack
    ]);
    const mergedRef = (0, _usemergedref.useMergedRef)(observeLinkVisibilityOnMount, childRef);
    const childProps = {
        ref: mergedRef,
        onClick (e) {
            if ("TURBOPACK compile-time truthy", 1) {
                if (!e) {
                    throw Object.defineProperty(new Error(`Component rendered inside next/link has to pass click event to "onClick" prop.`), "__NEXT_ERROR_CODE", {
                        value: "E312",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
            if (!legacyBehavior && typeof onClick === 'function') {
                onClick(e);
            }
            if (legacyBehavior && child.props && typeof child.props.onClick === 'function') {
                child.props.onClick(e);
            }
            if (!router) {
                return;
            }
            if (e.defaultPrevented) {
                return;
            }
            linkClicked(e, formattedHref, linkInstanceRef, replace, scroll, onNavigate, transitionTypes, prefetchIntent);
        },
        onMouseEnter (e) {
            if (!legacyBehavior && typeof onMouseEnterProp === 'function') {
                onMouseEnterProp(e);
            }
            if (legacyBehavior && child.props && typeof child.props.onMouseEnter === 'function') {
                child.props.onMouseEnter(e);
            }
            if (!router) {
                return;
            }
            if ("TURBOPACK compile-time truthy", 1) {
                return;
            }
            //TURBOPACK unreachable
            ;
            const upgradeToDynamicPrefetch = undefined;
        },
        onTouchStart: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : function onTouchStart(e) {
            if (!legacyBehavior && typeof onTouchStartProp === 'function') {
                onTouchStartProp(e);
            }
            if (legacyBehavior && child.props && typeof child.props.onTouchStart === 'function') {
                child.props.onTouchStart(e);
            }
            if (!router) {
                return;
            }
            if (!prefetchEnabled) {
                return;
            }
            const upgradeToDynamicPrefetch = unstable_dynamicOnHover === true;
            (0, _links.onNavigationIntent)(e.currentTarget, upgradeToDynamicPrefetch);
        }
    };
    // If the url is absolute, we can bypass the logic to prepend the basePath.
    if ((0, _utils.isAbsoluteUrl)(formattedHref)) {
        childProps.href = formattedHref;
    } else if (!legacyBehavior || passHref || child.type === 'a' && !('href' in child.props)) {
        childProps.href = (0, _addbasepath.addBasePath)(formattedHref);
    }
    let link;
    if (legacyBehavior) {
        if ("TURBOPACK compile-time truthy", 1) {
            const { errorOnce } = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils/error-once.js [app-client] (ecmascript)");
            errorOnce('`legacyBehavior` is deprecated and will be removed in a future ' + 'release. A codemod is available to upgrade your components:\n\n' + 'npx @next/codemod@latest new-link .\n\n' + 'Learn more: https://nextjs.org/docs/app/building-your-application/upgrading/codemods#remove-a-tags-from-link-components');
        }
        link = /*#__PURE__*/ _react.default.cloneElement(child, childProps);
    } else {
        link = /*#__PURE__*/ (0, _jsxruntime.jsx)("a", {
            ...restProps,
            ...childProps,
            children: children
        });
    }
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(LinkStatusContext.Provider, {
        value: linkStatus,
        children: link
    });
}
const LinkStatusContext = /*#__PURE__*/ (0, _react.createContext)(_links.IDLE_LINK_STATUS);
const useLinkStatus = ()=>{
    return (0, _react.useContext)(LinkStatusContext);
};
function getFetchStrategyFromPrefetchIntent(prefetchIntent) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        return prefetchIntent === 'auto' ? _types.FetchStrategy.PPR : _types.FetchStrategy.Full;
    }
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/node_modules/next/dist/client/use-merged-ref.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useMergedRef", {
    enumerable: true,
    get: function() {
        return useMergedRef;
    }
});
const _react = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
function useMergedRef(refA, refB) {
    const cleanupA = (0, _react.useRef)(null);
    const cleanupB = (0, _react.useRef)(null);
    // NOTE: In theory, we could skip the wrapping if only one of the refs is non-null.
    // (this happens often if the user doesn't pass a ref to Link/Form/Image)
    // But this can cause us to leak a cleanup-ref into user code (previously via `<Link legacyBehavior>`),
    // and the user might pass that ref into ref-merging library that doesn't support cleanup refs
    // (because it hasn't been updated for React 19)
    // which can then cause things to blow up, because a cleanup-returning ref gets called with `null`.
    // So in practice, it's safer to be defensive and always wrap the ref, even on React 19.
    return (0, _react.useCallback)((current)=>{
        if (current === null) {
            const cleanupFnA = cleanupA.current;
            if (cleanupFnA) {
                cleanupA.current = null;
                cleanupFnA();
            }
            const cleanupFnB = cleanupB.current;
            if (cleanupFnB) {
                cleanupB.current = null;
                cleanupFnB();
            }
        } else {
            if (refA) {
                cleanupA.current = applyRef(refA, current);
            }
            if (refB) {
                cleanupB.current = applyRef(refB, current);
            }
        }
    }, [
        refA,
        refB
    ]);
}
function applyRef(refA, current) {
    if (typeof refA === 'function') {
        const cleanup = refA(current);
        if (typeof cleanup === 'function') {
            return cleanup;
        } else {
            return ()=>refA(null);
        }
    } else {
        refA.current = current;
        return ()=>{
            refA.current = null;
        };
    }
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/node_modules/next/dist/shared/lib/router/utils/format-url.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// Format function modified from nodejs
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    formatUrl: null,
    formatWithValidation: null,
    urlObjectKeys: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    formatUrl: function() {
        return formatUrl;
    },
    formatWithValidation: function() {
        return formatWithValidation;
    },
    urlObjectKeys: function() {
        return urlObjectKeys;
    }
});
const _interop_require_wildcard = __turbopack_context__.r("[project]/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs [app-client] (ecmascript)");
const _querystring = /*#__PURE__*/ _interop_require_wildcard._(__turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/router/utils/querystring.js [app-client] (ecmascript)"));
const slashedProtocols = /https?|ftp|gopher|file/;
function formatUrl(urlObj) {
    let { auth, hostname } = urlObj;
    let protocol = urlObj.protocol || '';
    let pathname = urlObj.pathname || '';
    let hash = urlObj.hash || '';
    let query = urlObj.query || '';
    let host = false;
    auth = auth ? encodeURIComponent(auth).replace(/%3A/i, ':') + '@' : '';
    if (urlObj.host) {
        host = auth + urlObj.host;
    } else if (hostname) {
        host = auth + (~hostname.indexOf(':') ? `[${hostname}]` : hostname);
        if (urlObj.port) {
            host += ':' + urlObj.port;
        }
    }
    if (query && typeof query === 'object') {
        query = String(_querystring.urlQueryToSearchParams(query));
    }
    let search = urlObj.search || query && `?${query}` || '';
    if (protocol && !protocol.endsWith(':')) protocol += ':';
    if (urlObj.slashes || (!protocol || slashedProtocols.test(protocol)) && host !== false) {
        host = '//' + (host || '');
        if (pathname && pathname[0] !== '/') pathname = '/' + pathname;
    } else if (!host) {
        host = '';
    }
    if (hash && hash[0] !== '#') hash = '#' + hash;
    if (search && search[0] !== '?') search = '?' + search;
    pathname = pathname.replace(/[?#]/g, encodeURIComponent);
    search = search.replace('#', '%23');
    return `${protocol}${host}${pathname}${search}${hash}`;
}
const urlObjectKeys = [
    'auth',
    'hash',
    'host',
    'hostname',
    'href',
    'path',
    'pathname',
    'port',
    'protocol',
    'query',
    'search',
    'slashes'
];
function formatWithValidation(url) {
    if ("TURBOPACK compile-time truthy", 1) {
        if (url !== null && typeof url === 'object') {
            Object.keys(url).forEach((key)=>{
                if (!urlObjectKeys.includes(key)) {
                    console.warn(`Unknown key passed via urlObject into url.format: ${key}`);
                }
            });
        }
    }
    return formatUrl(url);
}
}),
"[project]/node_modules/next/dist/shared/lib/router/utils/is-local-url.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isLocalURL", {
    enumerable: true,
    get: function() {
        return isLocalURL;
    }
});
const _utils = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils.js [app-client] (ecmascript)");
const _hasbasepath = __turbopack_context__.r("[project]/node_modules/next/dist/client/has-base-path.js [app-client] (ecmascript)");
function isLocalURL(url) {
    // prevent a hydration mismatch on href for url with anchor refs
    if (!(0, _utils.isAbsoluteUrl)(url)) return true;
    try {
        // absolute urls can be local if they are on the same origin
        const locationOrigin = (0, _utils.getLocationOrigin)();
        const resolved = new URL(url, locationOrigin);
        return resolved.origin === locationOrigin && (0, _hasbasepath.hasBasePath)(resolved.pathname);
    } catch (_) {
        return false;
    }
}
}),
"[project]/node_modules/next/dist/shared/lib/router/utils/querystring.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    assign: null,
    searchParamsToUrlQuery: null,
    urlQueryToSearchParams: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    assign: function() {
        return assign;
    },
    searchParamsToUrlQuery: function() {
        return searchParamsToUrlQuery;
    },
    urlQueryToSearchParams: function() {
        return urlQueryToSearchParams;
    }
});
function searchParamsToUrlQuery(searchParams) {
    const query = {};
    for (const [key, value] of searchParams.entries()){
        const existing = query[key];
        if (typeof existing === 'undefined') {
            query[key] = value;
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            query[key] = [
                existing,
                value
            ];
        }
    }
    return query;
}
function stringifyUrlQueryParam(param) {
    if (typeof param === 'string') {
        return param;
    }
    if (typeof param === 'number' && !isNaN(param) || typeof param === 'boolean') {
        return String(param);
    } else {
        return '';
    }
}
function urlQueryToSearchParams(query) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)){
        if (Array.isArray(value)) {
            for (const item of value){
                searchParams.append(key, stringifyUrlQueryParam(item));
            }
        } else {
            searchParams.set(key, stringifyUrlQueryParam(value));
        }
    }
    return searchParams;
}
function assign(target, ...searchParamsList) {
    for (const searchParams of searchParamsList){
        for (const key of searchParams.keys()){
            target.delete(key);
        }
        for (const [key, value] of searchParams.entries()){
            target.append(key, value);
        }
    }
    return target;
}
}),
"[project]/node_modules/next/dist/shared/lib/utils.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DecodeError: null,
    MiddlewareNotFoundError: null,
    MissingStaticPage: null,
    NormalizeError: null,
    PageNotFoundError: null,
    SP: null,
    ST: null,
    WEB_VITALS: null,
    execOnce: null,
    getDisplayName: null,
    getLocationOrigin: null,
    getURL: null,
    isAbsoluteUrl: null,
    isResSent: null,
    loadGetInitialProps: null,
    normalizeRepeatedSlashes: null,
    stringifyError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DecodeError: function() {
        return DecodeError;
    },
    MiddlewareNotFoundError: function() {
        return MiddlewareNotFoundError;
    },
    MissingStaticPage: function() {
        return MissingStaticPage;
    },
    NormalizeError: function() {
        return NormalizeError;
    },
    PageNotFoundError: function() {
        return PageNotFoundError;
    },
    SP: function() {
        return SP;
    },
    ST: function() {
        return ST;
    },
    WEB_VITALS: function() {
        return WEB_VITALS;
    },
    execOnce: function() {
        return execOnce;
    },
    getDisplayName: function() {
        return getDisplayName;
    },
    getLocationOrigin: function() {
        return getLocationOrigin;
    },
    getURL: function() {
        return getURL;
    },
    isAbsoluteUrl: function() {
        return isAbsoluteUrl;
    },
    isResSent: function() {
        return isResSent;
    },
    loadGetInitialProps: function() {
        return loadGetInitialProps;
    },
    normalizeRepeatedSlashes: function() {
        return normalizeRepeatedSlashes;
    },
    stringifyError: function() {
        return stringifyError;
    }
});
const WEB_VITALS = [
    'CLS',
    'FCP',
    'FID',
    'INP',
    'LCP',
    'TTFB'
];
function execOnce(fn) {
    let used = false;
    let result;
    return (...args)=>{
        if (!used) {
            used = true;
            result = fn(...args);
        }
        return result;
    };
}
// Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
// Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
const isAbsoluteUrl = (url)=>{
    // Fast path: an absolute URL must start with a letter (the scheme).
    // Check for a-z and A-Z without the cost of the regex.
    const c = url.charCodeAt(0);
    const isLetter = c >= 65 /* A */  && c <= 90 || c >= 97 /* a */  && c <= 122;
    /* z */ if (!isLetter) {
        return false;
    }
    return ABSOLUTE_URL_REGEX.test(url);
};
function getLocationOrigin() {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
}
function getURL() {
    const { href } = window.location;
    const origin = getLocationOrigin();
    return href.substring(origin.length);
}
function getDisplayName(Component) {
    return typeof Component === 'string' ? Component : Component.displayName || Component.name || 'Unknown';
}
function isResSent(res) {
    return res.finished || res.headersSent;
}
function normalizeRepeatedSlashes(url) {
    const urlParts = url.split('?');
    const urlNoQuery = urlParts[0];
    return urlNoQuery // first we replace any non-encoded backslashes with forward
    // then normalize repeated forward slashes
    .replace(/\\/g, '/').replace(/\/\/+/g, '/') + (urlParts[1] ? `?${urlParts.slice(1).join('?')}` : '');
}
async function loadGetInitialProps(App, ctx) {
    if ("TURBOPACK compile-time truthy", 1) {
        if (App.prototype?.getInitialProps) {
            const message = `"${getDisplayName(App)}.getInitialProps()" is defined as an instance method - visit https://nextjs.org/docs/messages/get-initial-props-as-an-instance-method for more information.`;
            throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
                value: "E1035",
                enumerable: false,
                configurable: true
            });
        }
    }
    // when called from _app `ctx` is nested in `ctx`
    const res = ctx.res || ctx.ctx && ctx.ctx.res;
    if (!App.getInitialProps) {
        if (ctx.ctx && ctx.Component) {
            // @ts-ignore pageProps default
            return {
                pageProps: await loadGetInitialProps(ctx.Component, ctx.ctx)
            };
        }
        return {};
    }
    const props = await App.getInitialProps(ctx);
    if (res && isResSent(res)) {
        return props;
    }
    if (!props) {
        const message = `"${getDisplayName(App)}.getInitialProps()" should resolve to an object. But found "${props}" instead.`;
        throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
            value: "E1025",
            enumerable: false,
            configurable: true
        });
    }
    if ("TURBOPACK compile-time truthy", 1) {
        if (Object.keys(props).length === 0 && !ctx.ctx) {
            console.warn(`${getDisplayName(App)} returned an empty object from \`getInitialProps\`. This de-optimizes and prevents automatic static optimization. https://nextjs.org/docs/messages/empty-object-getInitialProps`);
        }
    }
    return props;
}
const SP = typeof performance !== 'undefined';
const ST = SP && [
    'mark',
    'measure',
    'getEntriesByName'
].every((method)=>typeof performance[method] === 'function');
class DecodeError extends Error {
}
class NormalizeError extends Error {
}
class PageNotFoundError extends Error {
    constructor(page){
        super();
        this.code = 'ENOENT';
        this.name = 'PageNotFoundError';
        this.message = `Cannot find module for page: ${page}`;
    }
}
class MissingStaticPage extends Error {
    constructor(page, message){
        super();
        this.message = `Failed to load static file for page: ${page} ${message}`;
    }
}
class MiddlewareNotFoundError extends Error {
    constructor(){
        super();
        this.code = 'ENOENT';
        this.message = `Cannot find the middleware module`;
    }
}
function stringifyError(error) {
    return JSON.stringify({
        message: error.message,
        stack: error.stack
    });
}
}),
"[project]/node_modules/next/dist/shared/lib/utils/error-once.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "errorOnce", {
    enumerable: true,
    get: function() {
        return errorOnce;
    }
});
let errorOnce = (_)=>{};
if ("TURBOPACK compile-time truthy", 1) {
    const errors = new Set();
    errorOnce = (msg)=>{
        if (!errors.has(msg)) {
            console.error(msg);
        }
        errors.add(msg);
    };
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_0jh26kz._.js.map