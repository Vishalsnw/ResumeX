
<old_str>
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.nodePackages.nodemon
  ];
}
</old_str>
<new_str>
{ pkgs }: {
  deps = [
    pkgs.nodejs_18
    pkgs.nodePackages.npm
    pkgs.nodePackages.nodemon
  ];
}
</new_str>
