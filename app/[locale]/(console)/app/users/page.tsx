import Screen from "@/components/console/Screen";
import Users from "@/components/console/screens/identity/Users";
import { titleFrom } from "@/i18n/console";

export const generateMetadata = titleFrom((m) => m.nav.users);

export default function UsersPage() {
  return (
    <Screen>
      <Users />
    </Screen>
  );
}
