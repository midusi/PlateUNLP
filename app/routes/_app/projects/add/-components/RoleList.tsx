import { Select } from "~/components/ui/select";
import defaultUserImage from "~/assets/avatar.png"
import { use } from "react";
import { getUsers } from "../-actions/get-users";
import { useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";

interface RoleListProps {
    title:string, 
    role:string,
    users: {
        id:string,
        name:string,
        email:string,
        image:string,
    }[]
}

export function RoleList ({title, role, users}:RoleListProps) {
    
    const [selected, setSelected] = useState<string[]>([])
    return <div className="w-full">
        <div className="flex select-none items-center gap-2 font-medium text-sm leading-none data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[invalid]:text-destructive data-[disabled]:opacity-50 pb-2">
            {title}
        </div>
        <div className="h-[200px] w-full border overflow-y-auto">
            {users.map((user) => (
                <div key={user.id} className="flex w-full items-center p-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-100 justify-between">
                    <div className="flex items-center flex-row gap-4">
                        <img 
                            src={user.image} 
                            alt={user.name} 
                            className="w-8 h-8 object-cover rounded-full border border-black bg-blue-100" 
                        />
                        <div className="flex flex-col">
                            <label>{user.name}</label>
                            <label className="text-gray-700">{user.email}</label>
                        </div>
                    </div>
                    <Checkbox
                      checked={selected.some(id => id === user.id)}
                    />
                </div>
            ))}
        </div>
    </div>
}