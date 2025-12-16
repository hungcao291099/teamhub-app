import * as React from 'react';

export interface LiquidSideBarItemProps {
    item: {
        icon?: React.ElementType;
        label?: string;
        to?: string;
        isActive?: boolean;
    };
    className?: string;
    onClick?: () => void;
    children?: React.ReactNode;
    section?: 'nav' | 'footer';
}

export const LiquidSideBarItem: React.ForwardRefExoticComponent<LiquidSideBarItemProps & React.RefAttributes<any>>;

export interface LiquidSideBarProps {
    items?: any[];
    className?: string;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

export const LiquidSideBar: React.FC<LiquidSideBarProps>;
