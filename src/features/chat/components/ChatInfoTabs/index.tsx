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
    participants,
    conversationId,
    type,
    currentUserRole,
    onRemoveMember,
    onPromoteMember
}) => {
    // Determine default tab based on type
    const defaultTab = type === "group" ? "members" : "media";
    const gridCols = type === "group" ? "grid-cols-3" : "grid-cols-2";

    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className={`grid w-full ${gridCols}`}>
                {/* Only show Members tab for groups */}
                {type === "group" && <TabsTrigger value="members">Thành viên</TabsTrigger>}
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="links">Link</TabsTrigger>
            </TabsList>

            <div className="mt-4 min-h-[300px]">
                {type === "group" && (
                    <TabsContent value="members" className="m-0 border-none p-0 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-500">
                        <MemberList
                            participants={participants}
                            currentUserRole={currentUserRole}
                            onRemoveMember={onRemoveMember}
                            onPromoteMember={onPromoteMember}
                        />
                    </TabsContent>
                )}

                <TabsContent value="media" className="m-0 border-none p-0 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-500">
                    <MediaList conversationId={conversationId} />
                </TabsContent>

                <TabsContent value="links" className="m-0 border-none p-0 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-500">
                    <LinkList conversationId={conversationId} />
                </TabsContent>
            </div>
        </Tabs>
    );
};
