# New subdomain

Turn one object sheet into the full file tree: domain, model, persistence, readonly, and `query-by-id`. The aggregate file does not exist anywhere in the repo. GraphQL stays off this path until the user names that transport.

1. [Read the dictionary](../SKILL.md#read-the-dictionary) by following [excel/read.md](../excel/read.md). Contexts names the context and the sheet tab. Shape is the field tree.
2. Read [field-types.md](../field-types.md). It decides value object, entity, and scalar for each node.
3. Read [file-tree.md](../file-tree.md). Write every file in the Domain, Model, Seed, Persistence, and Application service sections. Open the linked page in `files/` as you write that file. The page is the body. Skip the Transports section.
4. When the context already has other subdomains, add this one to the existing passport and indexes. Do not replace those files.
5. A subdomain named `role`, or whose name ends in `-role`, uses [files/domain/role.aggregate.md](../files/domain/role.aggregate.md) for the aggregate. Write its permission files from that page. The sheet is not the source of those flags yet.

Finding the aggregate under a different context folder means the subdomain already exists. Switch to [Update an existing subdomain](update-existing-subdomain.md).
