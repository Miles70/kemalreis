import { Link, NavLink } from "react-router-dom";
import {
  ChevronDown,
  MapPinned,
  RefreshCcw,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";

import { useLanguage } from "../../i18n/LanguageContext";

import "./LocalNavigation.css";

const localServices = [
  {
    key: "supermarket",
    path: "/local/supermarket",
    Icon: ShoppingBasket,
  },
  {
    key: "restaurants",
    path: "/local/restaurants",
    Icon: UtensilsCrossed,
  },
  {
    key: "secondHand",
    path: "/local/second-hand",
    Icon: RefreshCcw,
  },
  {
    key: "nearby",
    path: "/local/nearby",
    Icon: MapPinned,
  },
];

function LocalNavigation() {
  const { t } = useLanguage();

  return (
    <div className="localNavMenu">
      <NavLink
        to="/local"
        className={({ isActive }) =>
          `localNavTrigger${isActive ? " active" : ""}`
        }
      >
        <span>{t("nav.local")}</span>
        <ChevronDown className="localNavChevron" size={15} aria-hidden="true" />
      </NavLink>

      <div className="localNavDropdown" role="menu" aria-label={t("nav.local")}>
        {localServices.map(({ key, path, Icon }) => (
          <Link key={key} to={path} role="menuitem">
            <span className="localNavDropdownIcon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span>
              <strong>{t(`localPage.services.${key}.title`)}</strong>
              <small>{t(`localPage.services.${key}.description`)}</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LocalNavigation;
