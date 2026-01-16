import type { Meta, StoryObj } from '@storybook/react';
import { AboutSection } from '@/components/directory/AboutSection';

const meta = {
    title: 'Molecules/Directory/AboutSection',
    component: AboutSection,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'About/bio text section with markdown support and "Read more" expansion for long content. Used for resident and family profile descriptions. \n\n**Status**: Profile content section\n\n**Pages**: `/dashboard/neighbours/[id]`, `/dashboard/families/[id]`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AboutSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShortBio: Story = {
    args: {
        content: 'I love my wife and dog Lola, and am super excited about Frijolin joining our family.',
    },
};

export const LongBio: Story = {
    args: {
        content: 'I love my wife and dog Lola, and am super excited about Frijolin joining our family. We are passionate about sustainable living, organic gardening, and building strong community connections. We believe in sharing resources, supporting local businesses, and creating a vibrant neighborhood where everyone feels welcome and valued. In our free time, we enjoy hiking, cooking together, hosting dinner parties, and exploring new places. We are thrilled to be part of this wonderful community and look forward to getting to know our neighbors better.',
    },
};

export const WithMarkdown: Story = {
    args: {
        content: `# About Our Family

We are passionate about **sustainable living** and *community building*.

## Our Interests
- Organic gardening
- Community events
- Local food systems

We love hosting dinner parties and meeting new neighbors!`,
    },
};

export const FamilyDescription: Story = {
    args: {
        content: 'The Rodriguez family has been part of this community since 2020. We have two children and a golden retriever named Max. We enjoy organizing community movie nights and are always happy to help neighbors with gardening projects.',
    },
};
