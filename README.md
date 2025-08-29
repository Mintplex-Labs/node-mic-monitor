To release a new version, run the following command:

```bash
cd package
npm publish --access public --dry-run # Check if the package is valid and file structure is correct
npm publish --access public # Publish the package
```