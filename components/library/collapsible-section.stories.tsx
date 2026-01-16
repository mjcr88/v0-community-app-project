import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleSection } from '@/components/directory/CollapsibleSection';

const meta = {
    title: 'Molecules/Directory/CollapsibleSection',
    component: CollapsibleSection,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Collapsible card section wrapper for profile pages. Features icon, title, description, and responsive behavior (auto-open on desktop, collapsible on mobile). \n\n**Status**: Profile page wrapper\n\n**Pages**: `/dashboard/neighbours/[id]`, `/dashboard/families/[id]` (profile sections)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof CollapsibleSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'About',
        iconName: 'User',
        children: <p className="text-muted-foreground">This is some content inside a collapsible section.</p>,
    },
};

export const WithDescription: Story = {
    args: {
        title: 'Contact Information',
        iconName: 'Mail',
        description: 'Email and phone details',
        children: (
            <div className="space-y-2">
                <p>Email: example@email.com</p>
                <p>Phone: +1 234 567 8900</p>
            </div>
        ),
    },
};

export const DefaultOpen: Story = {
    args: {
        title: 'Skills',
        iconName: 'Lightbulb',
        defaultOpen: true,
        children: <p className="text-muted-foreground">Skills list appears here...</p>,
    },
};

export const DifferentIcons: Story = {
    render: () => (
        <div className="space-y-4">
            <CollapsibleSection title="Family" iconName="Users">
                <p>Family members</p>
            </CollapsibleSection>
            <CollapsibleSection title="Pets" iconName="PawPrint">
                <p>Pets list</p>
            </CollapsibleSection>
            <CollapsibleSection title="Location" iconName="MapPin">
                <p>Location details</p>
            </CollapsibleSection>
        </div>
    ),
};
