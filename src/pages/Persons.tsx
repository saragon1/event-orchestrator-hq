
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { PersonList } from "@/components/persons/person-list";

const Persons = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Persons">
      <PersonList onAdd={() => navigate("/persons/new")} />
    </DashboardLayout>
  );
};

export default Persons;
