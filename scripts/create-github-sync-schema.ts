// Sanity schema for githubSync document type
// Run this in Sanity Studio or add to your schema files

export default {
  name: 'githubSync',
  title: 'GitHub Sync',
  type: 'document',
  fields: [
    {
      name: 'userId',
      title: 'User ID',
      type: 'string',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    {
      name: 'dataJson',
      title: 'Data JSON',
      type: 'text',
      description: 'JSON stringified GitHub contribution data',
    },
    {
      name: 'lastSynced',
      title: 'Last Synced',
      type: 'datetime',
    },
  ],
  preview: {
    select: {
      userId: 'userId',
      year: 'year',
      lastSynced: 'lastSynced',
    },
    prepare({ userId, year, lastSynced }: { userId: string; year: number; lastSynced: string }) {
      return {
        title: `GitHub Sync - ${year}`,
        subtitle: `User: ${userId} | Last synced: ${lastSynced ? new Date(lastSynced).toLocaleDateString() : 'Never'}`,
      }
    },
  },
}
