# CSV Processing Tool by UrsusTheMinor



## What does this do?

This tool, written in Nodejs updates automatically any CSV Files given, may it be a link or a relative path.

It was written to automatically fetch CSV Files from Suppliers (Channable, etc.) and put them together to create fixed IDs and
update everything automatically to sync stock with Shopify (for the Syncing with Shopify I use the App stock-sync.com).

## How to start

Start by adding a Link with a name:

```
node script.js add <name> <link_to_file>
```

To verify it created the config and added you input type:
```
node script.js retrieve
```

Perfect, you can now add as many Links as you want, just make sure they are all CSV!

You can now start the Programm with:

```
./start
```

Now just type `y`, and you're good to go!


If you now want to stop the programm just type
```
./start
```
again and type `y`.


Let's say you want to delete a Link just type: (Not yet implemented)

```
node script.js delete <name>
```


## Problems that I am aware of that will be fixed asap

1. It currently uses fixed indexes for the ID, Stock and Title of Products.
2. There is no delete function for the config
