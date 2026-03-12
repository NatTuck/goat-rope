
We're building simple multiplayer game demo called Goat Rope.

Stack:

- JavaScript not TypeScript
- vite-express
- excalibur.js
- socket.io

Assets:

- images/goat-sprites.png is a 6x3 spritesheet of a goat
- images/goat-sprites.json is sprite metadata for the goat

Hints:

- Remember that you can look at the source code (and maybe even docs)
for dependencies under ./node_modules/

Rules:

- As the project changes, keep .gitignore up to date.
- All deps must be installed via NPM. No runtime external resources like CDNs.
- Do not write stuff to /tmp. If you need temp files, create and use a ./tmp
  directory.
- Do not run the server. If the user wants to run or restart the server, then
  they can do that.
- For individual bugs, follow TDD:
  - Write a test that fails because of the bug.
  - Run the test to confirm it fails.
  - Fix.
  - Run the test to confirm it passes.
- Every test *must* test the behavior of specific code. No tests should operate
  on the text of the source code nor should tests just test for the existence of
  some code.
- DO NOT KILL OPENCODE.
