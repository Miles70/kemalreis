import en from "./locales/en";
import tr from "./locales/tr";
import ru from "./locales/ru";
import ar from "./locales/ar";
import zh from "./locales/zh";
import paymentTranslations from "./paymentTranslations";
import authTranslations from "./authTranslations";
import accountTranslations from "./accountTranslations";
import localTranslations from "./localTranslations";

function withSharedTranslations(baseTranslations, language) {
  const payment = paymentTranslations[language] || paymentTranslations.en;
  const auth = authTranslations[language] || authTranslations.en;
  const account = accountTranslations[language] || accountTranslations.en;
  const local = localTranslations[language] || localTranslations.en;

  return {
    ...baseTranslations,
    nav: {
      ...baseTranslations.nav,
      ...local.nav,
    },
    auth,
    account,
    localPage: local.localPage,
    checkoutPage: {
      ...baseTranslations.checkoutPage,
      ...payment.checkoutPage,
    },
    orderSuccessPage: {
      ...baseTranslations.orderSuccessPage,
      ...payment.orderSuccessPage,
    },
  };
}

const translations = {
  en: withSharedTranslations(en, "en"),
  tr: withSharedTranslations(tr, "tr"),
  ru: withSharedTranslations(ru, "ru"),
  ar: withSharedTranslations(ar, "ar"),
  zh: withSharedTranslations(zh, "zh"),
};

export default translations;
