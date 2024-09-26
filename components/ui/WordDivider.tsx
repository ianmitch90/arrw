import React from 'react';
import { Divider } from '@nextui-org/react';

export const WordDivider = (word: string) => (
  <div className="flex items-center gap-4 py-2 ">
    <Divider className="flex-1" />
    <p className="shrink-0 text-tiny text-default-500">{word}</p>
    <Divider className="flex-1" />
  </div>
);
