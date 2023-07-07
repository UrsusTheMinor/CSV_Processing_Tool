# CSV Processing Tool by UrsusTheMinor



## What does this do?

This tool, written in Nodejs updates automatically any CSV Files given, may it be a link or a relative path.

It was written to automatically fetch CSV Files from Suppliers (Channable, etc.) and put them together to create fixed IDs and
update everything automatically to sync stock with Shopify (for the Syncing with Shopify I use the App stock-sync.com).

## How to start

Start by adding a Link (can be a web link or relative link), a name, a primary index, a updating index and as many other indices (indices of the original file):

```
node script.js add <name> <link_to_file> <primary> <updating> <arg1> ...
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

**Congratulations** you now have successfully started the programm for the first time, this may take a cupple minutes

If you now want to stop the programm just write the following line again and type `y`:
```
./start
```


To delete a link:

```
node script.js delete <name>
```

**or**

```
node script.js remove <name>
```

## Settings

If you want to edit the settings write the following:

```
node script.js config <settings> <arg1> <arg2> ...
```

List of all settings:

+ titles
+ output_file_name


## Problems that I am aware of that will be fixed asap

If you find any problems message me them via Discord: [ursustheminor](https://discordapp.com/users/ursustheminor)
