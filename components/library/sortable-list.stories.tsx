import type { Meta, StoryObj } from '@storybook/react';
import { SortableList, SortableListItem } from './sortable-list';
import React from 'react';

const meta = {
    title: 'Organisms/List/SortableList',
    component: SortableList,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Complex sortable list using Motion. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SortableList>;

export default meta;
type Story = StoryObj<typeof meta>;

const MockSortableList = () => {
    const [items, setItems] = React.useState([
        { id: 1, text: "Item 1", checked: false, description: "Desc 1" },
        { id: 2, text: "Item 2", checked: false, description: "Desc 2" },
        { id: 3, text: "Item 3", checked: false, description: "Desc 3" },
    ]);

    return (
        <div className="w-[400px]">
            <SortableList
                items={items}
                setItems={setItems}
                onCompleteItem={() => { }}
                renderItem={(item, index) => (
                    <SortableListItem
                        key={item.id}
                        item={item}
                        order={index}
                        onCompleteItem={() => { }}
                        onRemoveItem={() => { }}
                        handleDrag={() => { }}
                        renderExtra={() => <div className="p-4 border bg-white dark:bg-slate-900 rounded-xl mb-2">{item.text}</div>}
                    />
                )}
            />
        </div>
    );
};

export const Default: Story = {
    render: () => <MockSortableList />,
};
