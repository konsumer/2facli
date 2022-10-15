This is a tool for managing (Google Authenticator) 2FA codes, in the console. You can use it to get codes or QR codes to add them to another device.

## installation

```
npm i -g 2facli
```

You can also run it without installing:

```
npx -y 2facli --help
```

## usage

Run `2fa --help` for some help.

## tab-completion

You can setup tab-completion, if you use bash:

```sh
2fa completion >> ~/.bashrc
```

or add this for zsh:

```sh
printf "\nautoload -U +X compinit && compinit\n" >> ~/.zshrc
2fa completion >> ~/.zshrc
```