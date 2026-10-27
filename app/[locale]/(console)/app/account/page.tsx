import Screen from "@/components/console/Screen";
import Account from "@/components/console/screens/identity/Account";
import { titleFrom } from "@/i18n/console";

export const generateMetadata = titleFrom((m) => m.nav.account);

export default function AccountPage() {
  return (
    <Screen>
      <Account />
    </Screen>
  );
}
