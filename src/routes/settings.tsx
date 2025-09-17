import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@example.com");

  const getInitials = () => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Last Name</label>
            <Input 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <Button className="w-full">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}