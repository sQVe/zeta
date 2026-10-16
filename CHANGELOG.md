# zeta

## 0.1.0

### Minor Changes

- [#29](https://github.com/sQVe/zeta/pull/29)
  [`e031bb3`](https://github.com/sQVe/zeta/commit/e031bb3988e6504c17bf542c71e8b8b8392a21f6) Thanks
  [@sQVe](https://github.com/sQVe)! - Press `o` to open the selected row in the browser. A thread
  opens its page, a repo row opens its repo, and a group row opens every repo it holds. A failed
  open shows an error toast. A group row that spans more than 3 repos asks first: `y` or Enter opens
  them, and `n` or Esc cancels.

- [#20](https://github.com/sQVe/zeta/pull/20)
  [`2297ec4`](https://github.com/sQVe/zeta/commit/2297ec40c3302b29d6134155b6be3fcb4c386bc3) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta saves the notification list and shows it at once on the
  next start, with its age in the status line. An unchanged feed costs no rate limit on restart.

- [#31](https://github.com/sQVe/zeta/pull/31)
  [`ccfaf55`](https://github.com/sQVe/zeta/commit/ccfaf55503d2aa229c2f81d8bbc3ae21d007bd56) Thanks
  [@sQVe](https://github.com/sQVe)! - Press `f` in the list to open the filter composer, a `Filter`
  box under the chip bar. Type a `field:value` token, such as `author:@me`,
  `-repo:hups-co/platform`, `age:>3d`, or `is:pr`, or pick one from the list with `Up`, `Down`, and
  `Tab`. Typing also matches field and value loosely, so `rep plat` suggests
  `repo:hups-co/platform`. An empty box lists your chips and the most common values, and selects
  none until you press `Up` or `Down`. `Enter` adds the token as a chip and narrows the list. The
  list does not change while you type. A leading `-` excludes matches. Different fields combine with
  and. Chips of one field combine with or, except `age` and `title`, which combine with and, so
  `age:>7d age:<30d` is a range. Negated chips always exclude. Chips show above the list. To edit a
  chip, move to it, press `Tab`, change the text, and press `Enter`. `Esc` cancels the edit. `Enter`
  on a chip removes it. `Esc` closes the composer, and so does `Backspace` on an empty line. `F` in
  the list clears all filters. The last line of the box describes the selected row. `is:new` filters
  for new activity. An unfinished token such as `author:` shows no error while you type; `Enter` on
  a draft that cannot be read shows one.

- [#28](https://github.com/sQVe/zeta/pull/28)
  [`579fd17`](https://github.com/sQVe/zeta/commit/579fd17d6d7d2ccdd939811f6965b1b2920d8ee1) Thanks
  [@sQVe](https://github.com/sQVe)! - Press `d` on a group or repo row to mark every thread it shows
  done, folded or not. Zeta does not ask first. You can undo the done with `u` for 5 seconds.

- [#40](https://github.com/sQVe/zeta/pull/40)
  [`038cb7b`](https://github.com/sQVe/zeta/commit/038cb7b7b936098656e024461870cb3da99e142c) Thanks
  [@sQVe](https://github.com/sQVe)! - The filter composer closes after `Enter` adds or replaces a
  filter, so you no longer press `Esc` after each one. `Enter` on a chip still removes it and keeps
  the composer open. The `/` completion list now shows above the `/` line, with the best match next
  to the line.

- [#15](https://github.com/sQVe/zeta/pull/15)
  [`0d0e766`](https://github.com/sQVe/zeta/commit/0d0e7668112e9a2f5a81a31e350ec2a9f3e587d2) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta starts in the terminal with `bun run start` and quits
  with `q`, Ctrl+C, SIGINT, or SIGTERM. Quitting restores the terminal.

- [#23](https://github.com/sQVe/zeta/pull/23)
  [`39c9bb7`](https://github.com/sQVe/zeta/commit/39c9bb70687af3482008f1f73cb36eee3c94eb98) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta remembers the grouping you choose with `s` and starts
  with it on the next run. A state file from a newer Zeta stops startup, and an unreadable one shows
  a warning and is not overwritten.

- [#22](https://github.com/sQVe/zeta/pull/22)
  [`1f6fbe5`](https://github.com/sQVe/zeta/commit/1f6fbe5abfca84f90b007f190fc78a8294c13889) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta shows a detail pane beside the list when the terminal is
  90 columns wide or more. The pane shows the selected thread: its repository, type, number, title,
  reason, age, and unread state. For a group or repo it shows the thread counts by type and by
  reason. Below 90 columns the list fills the screen, and Enter on a thread opens its detail at full
  width. Esc returns to the list on the same row.

- [#27](https://github.com/sQVe/zeta/pull/27)
  [`9422a8b`](https://github.com/sQVe/zeta/commit/9422a8bbc6dde89f679e7127252ab7f62d9eb553) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta marks new threads with a `●` in the list. A thread is new
  when you have not seen its latest activity and the activity is not yours. Group and repo rows show
  how many new threads they hold, and the detail pane shows the same on a `New` line. The markers
  persist across restarts.

- [#18](https://github.com/sQVe/zeta/pull/18)
  [`168267e`](https://github.com/sQVe/zeta/commit/168267ee2dd63eb7088013c9012a322250907b6d) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta shows your GitHub notifications as a list. Press `j` and
  `k` to move the selection, and `r` to refresh.

- [#38](https://github.com/sQVe/zeta/pull/38)
  [`1969826`](https://github.com/sQVe/zeta/commit/19698263b49f30c13aba8bfa7f62a72d6ec266a1) Thanks
  [@sQVe](https://github.com/sQVe)! - The `/` line completes repository names and title words. Type
  part of a word, then press Tab or Shift-Tab to move through the matches. The line shows the chosen
  value and the list narrows at once.

- [#19](https://github.com/sQVe/zeta/pull/19)
  [`0194cfd`](https://github.com/sQVe/zeta/commit/0194cfd1b40399c74ebce2851f67d3d5d8b76021) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta keeps the notification list current on its own. It checks
  GitHub every minute or so, and `r` still refreshes at once. When GitHub rate limits Zeta, it stops
  asking until the limit resets and shows when in the status line.

- [#30](https://github.com/sQVe/zeta/pull/30)
  [`f5ec49c`](https://github.com/sQVe/zeta/commit/f5ec49cc20247321e64fdf31bedb8f3f007ab29c) Thanks
  [@sQVe](https://github.com/sQVe)! - Press `/` to open a search line under the list and narrow it
  as you type. A thread shows when its title or repository contains every word you typed. The line
  shows the match count. `Enter` keeps the text, `Esc` brings back the previous text, `Ctrl-U`
  clears the line, and `Backspace` on an empty line closes it. `Esc` in the list clears an active
  search.

- [#25](https://github.com/sQVe/zeta/pull/25)
  [`d61562a`](https://github.com/sQVe/zeta/commit/d61562a8009433f9646c189c55f68ffeacee0d55) Thanks
  [@sQVe](https://github.com/sQVe)! - The detail pane shows the state (open, closed, or merged) and
  the author of a pull request or issue thread, in dim text after the other facts. Zeta looks them
  up after a refresh, without delaying the list, and leaves a line out while it does not know the
  value.

- [#39](https://github.com/sQVe/zeta/pull/39)
  [`8b0dca6`](https://github.com/sQVe/zeta/commit/8b0dca6d1dd1892ddbc18bd5ce54cbd56aeafb64) Thanks
  [@sQVe](https://github.com/sQVe)! - Press `:` to open a command line. Type `messages` and press
  Enter to open `:messages`, which lists the recent toasts newest first, each with its time and
  tone, even after they cleared. Esc closes it.

- [#26](https://github.com/sQVe/zeta/pull/26)
  [`d0dec36`](https://github.com/sQVe/zeta/commit/d0dec3687c609be14b3e80c977f90cf42221c923) Thanks
  [@sQVe](https://github.com/sQVe)! - Press `d` to mark the selected thread done. The thread leaves
  the list at once and Zeta tells GitHub after 5 seconds. Press `u` within those 5 seconds to undo
  it. Quitting sends every waiting done first. A done thread stays hidden after a restart until it
  has new activity.

- [#21](https://github.com/sQVe/zeta/pull/21)
  [`a1d972c`](https://github.com/sQVe/zeta/commit/a1d972cc147ad8075c369b4f6d620ea3e3a8f54f) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta shows the notification list as a tree you can fold.
  Groups and repos show a count that stays when they are folded. Press `s` to cycle the grouping: by
  reason, by type, or none. The first two group threads, then repos. With none, the list is flat:
  one row per thread, newest first, with the repository in its own column. Press `z`, `space`, or
  `return` to fold a node, `Z` to fold all groups, `g` and `G` to jump to the first and last row,
  and `J` and `K` to jump between groups. The fold and group-jump keys do nothing in the flat list.

### Patch Changes

- [#37](https://github.com/sQVe/zeta/pull/37)
  [`41c0ca9`](https://github.com/sQVe/zeta/commit/41c0ca914201c8f0b031b7384da03b73d86774b3) Thanks
  [@sQVe](https://github.com/sQVe)! - Help scrolls when the terminal is too short to show every
  command. Press j or Down to scroll down, and k or Up to scroll up. A footer shows the position and
  the keys to scroll and close.

  Keys typed right after opening help or the thread detail now act on what just opened.

- [#24](https://github.com/sQVe/zeta/pull/24)
  [`950cee8`](https://github.com/sQVe/zeta/commit/950cee82a75f9e2d56023e9c37c5541cae1f56c3) Thanks
  [@sQVe](https://github.com/sQVe)! - Zeta shows a message when it cannot save your grouping.

- [#42](https://github.com/sQVe/zeta/pull/42)
  [`220fe60`](https://github.com/sQVe/zeta/commit/220fe604985ac67f056017dc670375285590fdab) Thanks
  [@sQVe](https://github.com/sQVe)! - At 80 columns, the status line no longer overlaps or cuts off
  its items. A state file that Zeta cannot read now shows a short reason and the file path as a
  message, kept in `:messages`, and the status line shows "state not saved". The GitHub CLI and
  sign-in notices show in full as a message when the list is on screen, and the status line keeps a
  short marker that names `r`.

- [#41](https://github.com/sQVe/zeta/pull/41)
  [`87c0167`](https://github.com/sQVe/zeta/commit/87c0167339c81fdc3dafb0d5910d6e23a41b5621) Thanks
  [@sQVe](https://github.com/sQVe)! - The `:messages` overlay now fills the whole screen, so no part
  of the list shows beside it. Opening pages in the browser now shows an info toast and adds it to
  `:messages`, so a successful open is no longer silent.
