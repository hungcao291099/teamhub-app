import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemberList } from './MemberList';
import { MediaList } from './MediaList';
import { LinkList } from './LinkList';

interface ChatInfoTabsProps {
    participants: any[]; // Using any for now, will fix type
    conversationId: number;
    type: "direct" | "group"; // Add type prop
    currentUserRole: string;
    onRemoveMember: (userId: number) => void;
    onPromoteMember: (userId: number, currentRole: string) => void;
}

export const ChatInfoTabs: React.FC<ChatInfoTabsProps> = ({
    participants = [], // Safe default
    conversationId,
    type,
    currentUserRole,
    onRemoveMember,
    onPromoteMember
}) => {
    // Determine default tab based on type
    const defaultTab = type === "group" ? "members" : "media";

    return (
        <Tabs defaultValue={defaultTab} className="w-full flex flex-col h-full bg-background">
            <div className="px-6 border-b">
                <TabsList className="w-full justify-start h-12 bg-transparent p-0 space-x-6">
                    {type === "group" && (
                        <TabsTrigger
                            value="members"
                            className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Thành viên
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="media"
                        className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Media
                    </TabsTrigger>
                    <TabsTrigger
                        value="links"
                        className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Link
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
                {type === "group" && (
                    <TabsContent value="members" className="m-0 h-full border-none p-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                        <MemberList
                            participants={participants}
                            currentUserRole={currentUserRole}
                            onRemoveMember={onRemoveMember}
                            onPromoteMember={onPromoteMember}
                        />
                    </TabsContent>
                )}

                <TabsContent
                    value="media"
                    forceMount={true}
                    className="m-0 h-full border-none p-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-500 data-[state=inactive]:hidden"
                >
                    <MediaList conversationId={conversationId} />
                </TabsContent>

                <TabsContent value="links" className="m-0 h-full border-none p-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                    <LinkList conversationId={conversationId} />
                </TabsContent>
            </div>
        </Tabs>
    );
};
