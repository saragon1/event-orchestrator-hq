
import { DashboardLayout } from "@/components/dashboard/layout";
import { PersonList } from "@/components/persons/person-list";

const Persons = () => {
  return (
    <DashboardLayout title="Persons">
      <PersonList />
    </DashboardLayout>
  );
};

export default Persons;
