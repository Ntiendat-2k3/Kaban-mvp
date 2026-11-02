'use client';

import React, { useState } from 'react';
import { Users, Check, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { BoardMember } from '@/types/board';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/utils';

interface CardMembersPopoverProps {
  boardMembers: BoardMember[];
  cardMembers: BoardMember[];
  onToggleMember: (userId: string, isAssigned: boolean) => Promise<void>;
}

/**
 * Molecule CardMembersPopover - Gán và gỡ thành viên của thẻ (SRS §4, BR-04)
 */
export function CardMembersPopover({
  boardMembers,
  cardMembers,
  onToggleMember,
}: CardMembersPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardMemberUserIds = new Set(cardMembers.map((m) => m.userId));

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs">
          <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Thành viên</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-72 rounded-lg border bg-popover p-3 shadow-lg outline-none animate-in fade-in-50"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold text-foreground">Thành viên bảng</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {boardMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  Chưa có thành viên nào khác trong bảng.
                </p>
              ) : (
                boardMembers.map((member) => {
                  const isAssigned = cardMemberUserIds.has(member.userId);
                  const initial = (member.name || member.email || 'U')[0].toUpperCase();

                  return (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => onToggleMember(member.userId, isAssigned)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md p-1.5 text-left text-xs transition-colors hover:bg-muted/80',
                        isAssigned && 'bg-muted/50 font-medium'
                      )}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                          <p className="truncate text-foreground font-medium">{member.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      {isAssigned && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
