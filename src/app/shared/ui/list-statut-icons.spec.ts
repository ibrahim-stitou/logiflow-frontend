import {
  STATUT_COMMANDES,
  statutCommandeLabel,
} from "../../commandes/commande";
import { statutOptionsFrom } from "./list-filter";
import { iconForStatutOption } from "./list-statut-filter";
import { commandeStatutIcon } from "./list-statut-icons";

describe("commandeStatutIcon", () => {
  it("maps each commande statut to a distinct lucide icon", () => {
    expect(commandeStatutIcon("RECUE")).toBe("lucideInbox");
    expect(commandeStatutIcon("CONFIRMEE")).toBe("lucideCircleCheck");
    expect(commandeStatutIcon("ANNULEE")).toBe("lucideCircleX");
  });
});

describe("statut filter options with icons", () => {
  it("wires commande icons into filter options", () => {
    const options = statutOptionsFrom(
      STATUT_COMMANDES,
      statutCommandeLabel,
      commandeStatutIcon
    );
    expect(iconForStatutOption(options[0])).toBe("lucideInbox");
    expect(iconForStatutOption(options[1])).toBe("lucideCircleCheck");
    expect(iconForStatutOption(options[2])).toBe("lucideCircleX");
  });
});
