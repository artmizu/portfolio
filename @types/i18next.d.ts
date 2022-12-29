// unfortunately it is so slow
// // import the original type declarations
// import "i18next";

// // import all namespaces (for the default language, only)
// import common from "../i18n/locales/ru/common.json";
// import about from "../i18n/locales/ru/about.json";
// import project from "../i18n/locales/ru/project.json";
// import opensource from "../i18n/locales/ru/opensource.json";

// declare module "i18next" {
//   // Extend CustomTypeOptions
//   interface CustomTypeOptions { 
//     // custom namespace type, if you changed it
//     defaultNS: "common";
//     // custom resources type
//     resources: {
//       common: typeof common;
//       about: typeof about;
//       project: typeof project;
//       opensource: typeof opensource;
//     };
//     // other
//   } 
// }