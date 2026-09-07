import type { Language } from "@/lib/context/LanguageContext";

// Same discipline as public-privacy-policy.ts: scoped to what this
// system actually does today. Two claims from the original draft are
// deliberately NOT included here because they're false against this
// codebase (verified directly, not assumed):
//   - "partner hospitals may verify membership at the point of care" —
//     there is no Hospital role implementation anywhere (no backend
//     module, no frontend route group, healthcare_verifications is
//     never written to).
//   - "unauthorized access attempts are logged and may be reported" —
//     nothing logs failed logins or unauthorized-access attempts; the
//     sessions table exists in schema but nothing writes to it
//     (CLAUDE.md's own Known Security Gaps list).
export const termsTranslations = {
  en: {
    heading: "Terms & Conditions",
    lastUpdatedLabel: "Last updated",
    lastUpdatedDate: "September 2026",
    intro:
      "These terms govern your use of Tujitunze, the Health Savings and Insurance Management System. By creating an account, you agree to the terms below.",
    sections: [
      {
        title: "Eligibility",
        body: "Tujitunze accounts are available to individuals who can provide a valid National ID (NIDA) number for identity verification. You are responsible for maintaining the confidentiality of your login credentials. Passwords are securely hashed using bcrypt and never stored in plain text.",
      },
      {
        title: "Health Wallet & Contributions",
        body: "Your health wallet records contributions made by you or on your behalf through supported telecom and bank channels. Wallet balances are internal accounting records maintained by Tujitunze; they are not deposit accounts with a bank or telecom operator. Transactions are processed through authenticated channels and logged for audit purposes where applicable.",
      },
      {
        title: "Insurance & Claims",
        body: "Insurance coverage displayed in your account reflects the plans and providers you are enrolled with. Claims are reviewed by the applicable insurance provider according to the terms of your plan. Hospital-side membership verification at the point of care is planned but not yet available.",
      },
      {
        title: "Acceptable Use",
        body: "You agree not to misuse the platform, attempt to access another member's data, or provide false identity or financial information. Accounts found in violation may be suspended pending review.",
      },
      {
        title: "Changes to the Service",
        body: "Tujitunze may update features, fees, or these terms from time to time. Material changes will be communicated through the platform before they take effect. We may also introduce new security or compliance features (such as HTTPS/TLS encryption and expanded audit logging) in future releases.",
      },
      {
        title: "Limitation of Liability",
        body: "Tujitunze provides its services on an \"as-is\" basis. While we strive for reliability, we do not guarantee uninterrupted access or error-free operation. We are not liable for losses resulting from telecom or bank network outages, third-party service interruptions, or user negligence.",
      },
      {
        title: "Contact Us",
        body: "Questions about these terms can be sent to tujitunze@gmail.com, by phone on +255 756 801 149, or through the Contact page. Our office is in Dar es Salaam, Tanzania.",
      },
      {
        title: "Future Compliance Commitments",
        body: "Tujitunze is preparing for full compliance with Tanzania's Personal Data Protection Act 2022 and relevant TIRA guidelines. Once formal registration and audits are complete, these terms will be updated to reflect verified compliance status.",
      },
    ],
  },
  sw: {
    heading: "Vigezo na Masharti",
    lastUpdatedLabel: "Ilisasishwa mara ya mwisho",
    lastUpdatedDate: "Septemba 2026",
    intro:
      "Vigezo hivi vinasimamia matumizi yako ya Tujitunze, Mfumo wa Akiba ya Afya na Usimamizi wa Bima. Kwa kufungua akaunti, unakubaliana na vigezo vilivyo hapa chini.",
    sections: [
      {
        title: "Sifa za Kustahili",
        body: "Akaunti za Tujitunze ni kwa ajili ya watu binafsi wanaoweza kutoa namba halali ya Kitambulisho cha Taifa (NIDA) kwa ajili ya uthibitisho wa utambulisho. Unawajibika kutunza siri za kuingia kwenye akaunti yako. Nywila husimbwa kwa usalama kwa kutumia bcrypt na hazihifadhiwi kama maandishi wazi kamwe.",
      },
      {
        title: "Mkoba wa Afya na Michango",
        body: "Mkoba wako wa afya unarekodi michango iliyofanywa na wewe au kwa niaba yako kupitia njia za simu na benki zinazotumika. Salio la mkoba ni kumbukumbu za uhasibu za ndani zinazosimamiwa na Tujitunze; si akaunti za amana kwa benki au mtoa huduma za simu. Miamala huchakatwa kupitia njia zilizothibitishwa na kurekodiwa kwenye kumbukumbu ya ukaguzi pale inapowezekana.",
      },
      {
        title: "Bima na Madai",
        body: "Huduma za bima zinazoonyeshwa kwenye akaunti yako zinaonyesha mipango na watoa huduma uliojiunga nao. Madai hukaguliwa na mtoa huduma wa bima husika kulingana na vigezo vya mpango wako. Uthibitishaji wa uanachama upande wa hospitali wakati wa huduma umepangwa lakini bado haupatikani.",
      },
      {
        title: "Matumizi Yanayokubalika",
        body: "Unakubali kutotumia vibaya jukwaa hili, kutojaribu kufikia taarifa za mwanachama mwingine, au kutoa taarifa za uongo za utambulisho au fedha. Akaunti zitakazobainika kukiuka masharti haya zinaweza kusimamishwa wakati wa ukaguzi.",
      },
      {
        title: "Mabadiliko ya Huduma",
        body: "Tujitunze inaweza kusasisha huduma, ada, au vigezo hivi mara kwa mara. Mabadiliko muhimu yatawasilishwa kupitia jukwaa kabla ya kuanza kutumika. Tunaweza pia kuanzisha vipengele vipya vya usalama au utii (kama vile usimbaji wa HTTPS/TLS na upanuzi wa kumbukumbu za ukaguzi) katika matoleo yajayo.",
      },
      {
        title: "Ukomo wa Dhima",
        body: "Tujitunze inatoa huduma zake kwa hali ilivyo (\"as-is\"). Ingawa tunajitahidi kuwa na uaminifu, hatuhakikishii ufikiaji usiokatizwa au utendaji usio na hitilafu. Hatuwajibiki kwa hasara zinazotokana na kukatika kwa mitandao ya simu au benki, usumbufu wa huduma za wahusika wengine, au uzembe wa mtumiaji.",
      },
      {
        title: "Wasiliana Nasi",
        body: "Maswali kuhusu vigezo hivi yanaweza kutumwa kwa tujitunze@gmail.com, kwa simu +255 756 801 149, au kupitia ukurasa wa Wasiliana Nasi. Ofisi yetu ipo Dar es Salaam, Tanzania.",
      },
      {
        title: "Ahadi za Utii Zijazo",
        body: "Tujitunze inajiandaa kutii kikamilifu Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania ya 2022 na miongozo husika ya TIRA. Usajili rasmi na ukaguzi utakapokamilika, vigezo hivi vitasasishwa kuonyesha hali iliyothibitishwa ya utii.",
      },
    ],
  },
} as const satisfies Record<
  Language,
  {
    heading: string;
    lastUpdatedLabel: string;
    lastUpdatedDate: string;
    intro: string;
    sections: { title: string; body: string }[];
  }
>;
