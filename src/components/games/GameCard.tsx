import { NavLink } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Users } from "lucide-react";

interface GameCardProps {
    id: string;
    name: string;
    description: string;
    icon: string;
    minPlayers: number;
    maxPlayers: number;
}

export function GameCard({ id, name, description, icon, minPlayers, maxPlayers }: GameCardProps) {
    return (
        <NavLink to={minPlayers > 1 ? `/games/${id}` : `/games/${id}/play`}>
            <Card className="h-full hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6 flex items-start gap-4">
                    {/* Game Icon */}
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>

                    {/* Game Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {description}
                        </p>

                        {/* Player count */}
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>
                                {minPlayers === maxPlayers
                                    ? `${minPlayers} người`
                                    : `${minPlayers}-${maxPlayers} người`}
                            </span>
                        </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
            </Card>
        </NavLink>
    );
}
