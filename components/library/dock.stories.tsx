import type { Meta, StoryObj } from '@storybook/react';
import { Dock, DockCard, DockCardInner, DockDivider } from './dock';
import { HomeIcon, Pencil1Icon, PersonIcon, GearIcon, GitHubLogoIcon } from '@radix-ui/react-icons';

const meta = {
    title: 'Organisms/Navigation/Dock',
    component: Dock,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'MacOS style dock. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Dock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Dock {...args}>
            <DockCard id="home">
                <DockCardInner src="" id="home"><HomeIcon className="w-6 h-6" /></DockCardInner>
            </DockCard>
            <DockCard id="edit">
                <DockCardInner src="" id="edit"><Pencil1Icon className="w-6 h-6" /></DockCardInner>
            </DockCard>
            <DockDivider />
            <DockCard id="user">
                <DockCardInner src="" id="user"><PersonIcon className="w-6 h-6" /></DockCardInner>
            </DockCard>
            <DockCard id="settings">
                <DockCardInner src="" id="settings"><GearIcon className="w-6 h-6" /></DockCardInner>
            </DockCard>
        </Dock>
    )
};
