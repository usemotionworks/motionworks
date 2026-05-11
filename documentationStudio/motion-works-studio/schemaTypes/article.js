export default {
  name: 'article',
  title: 'Documentation Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Getting Started With Motion Works', value: 'started'},
          {title: 'Uploading and Editing Your Music', value: 'uploading'},
          {title: 'Your Music in Stores and Services', value: 'releases'},
          {title: 'Analytics and Reporting', value: 'analytics'},
          {title: 'Wallet, Payouts & Royalties', value: 'wallet'},
          {title: 'Account Settings', value: 'account'},
        ],
      },
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block'}], // This is Sanity's rich text editor
    },
  ],
}
