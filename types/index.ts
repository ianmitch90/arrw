import type { SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export * from './user';
export * from './message';
export * from './profile';
export * from './place';
export * from './event';
export * from './chatroom';
export * from './report';
