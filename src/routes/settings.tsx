import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/store/userStore";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { firstName, lastName, email, setUserData } = useUserStore();
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localLastName, setLocalLastName] = useState(lastName);
  const [localEmail, setLocalEmail] = useState(email);

  const getInitials = () => {
    return `${localFirstName.charAt(0)}${localLastName.charAt(0)}`.toUpperCase();
  };

  const handleSave = () => {
    setUserData({
      firstName: localFirstName,
      lastName: localLastName,
      email: localEmail,
    });
  };

  return (
    <div className="ml-[280px] p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
            </Avatar>
          </div>
          
          <div>
            <label className="text-sm font-medium">First Name</label>
            <Input 
              value={localFirstName} 
              onChange={(e) => setLocalFirstName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Last Name</label>
            <Input 
              value={localLastName} 
              onChange={(e) => setLocalLastName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input 
              value={localEmail} 
              onChange={(e) => setLocalEmail(e.target.value)}
            />
          </div>
          
          <Button className="w-full" onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}