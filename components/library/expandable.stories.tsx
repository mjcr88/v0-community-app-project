import type { Meta, StoryObj } from '@storybook/react';
import { Expandable, ExpandableCard, ExpandableCardContent, ExpandableCardFooter, ExpandableCardHeader, ExpandableTrigger } from './expandable';
import { Button } from '@/components/ui/button';

const meta = {
    title: 'Molecules/Animation/Expandable',
    component: Expandable,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Component that expands on trigger. \n\n**Status**: Used in `admin-map` and `test-cultui`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Expandable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="h-[400px] flex items-center justify-center p-4">
            <Expandable>
                <ExpandableCard>
                    <ExpandableCardHeader>
                        <h3 className="text-lg font-semibold">Expandable Card</h3>
                        <ExpandableTrigger><Button variant="outline">Toggle</Button></ExpandableTrigger>
                    </ExpandableCardHeader>
                    <ExpandableCardContent>
                        <p className="text-sm text-neutral-500">
                            This content is hidden until expanded. It animates smoothly.
                        </p>
                        <div className="mt-4 h-20 bg-neutral-100 rounded" />
                    </ExpandableCardContent>
                    <ExpandableCardFooter>
                        <Button variant="ghost">Action</Button>
                    </ExpandableCardFooter>
                </ExpandableCard>
            </Expandable>
        </div>
    )
};
