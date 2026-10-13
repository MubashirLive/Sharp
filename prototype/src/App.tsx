import React, { useState } from "react";
import TeacherLoginPage from "./pages/TeacherLoginPage";
import PrincipalLoginPage from "./pages/PrincipalLoginPage";
import PrincipalSignUpPage from "./pages/PrincipalSignUpPage";

export default function App() {
  const [activePortal, setActivePortal] = useState<
    "teacher" | "principal_login" | "principal_new_device" | "principal_signup"
  >("principal_new_device");

  if (activePortal === "principal_signup") {
    return (
      <PrincipalSignUpPage
        onSwitchToTeacher={() => setActivePortal("teacher")}
        onSwitchToPrincipalLogin={() => setActivePortal("principal_login")}
        onSwitchToPrincipalNewDevice={() => setActivePortal("principal_new_device")}
      />
    );
  }

  if (activePortal === "principal_login") {
    return (
      <PrincipalLoginPage
        isNewDeviceMode={false}
        onSwitchToTeacher={() => setActivePortal("teacher")}
        onSwitchToPrincipalNewDevice={() => setActivePortal("principal_new_device")}
        onSwitchToPrincipalSignUp={() => setActivePortal("principal_signup")}
      />
    );
  }

  if (activePortal === "principal_new_device") {
    return (
      <PrincipalLoginPage
        isNewDeviceMode={true}
        onSwitchToTeacher={() => setActivePortal("teacher")}
        onSwitchToPrincipalLogin={() => setActivePortal("principal_login")}
        onSwitchToPrincipalSignUp={() => setActivePortal("principal_signup")}
      />
    );
  }

  return (
    <TeacherLoginPage
      onSwitchToPrincipalLogin={() => setActivePortal("principal_login")}
      onSwitchToPrincipalNewDevice={() => setActivePortal("principal_new_device")}
      onSwitchToPrincipalSignUp={() => setActivePortal("principal_signup")}
    />
  );
}
