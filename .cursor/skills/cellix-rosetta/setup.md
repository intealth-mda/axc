# Excel MCP setup

The dictionary read and write pages need the `excel` server. Do this once per machine.

- Install uv, which provides `uvx`:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

That creates `~/.local/bin/uvx`.

- Add an `excel` server to `~/.cursor/mcp.json`. Cursor does not see `PATH`, so the command is the full path. `--allow-dir` is the repo that holds the workbook.

```json
"excel": {
  "command": "/Users/<username>/.local/bin/uvx",
  "args": ["excel-mcp-server", "stdio", "--allow-dir", "/Volumes/files/src/<project-name>"]
}
```

- Reload the MCP server. The first start downloads the Python packages, then the connection stays up. The workbook has to sit inside the `--allow-dir` path.
