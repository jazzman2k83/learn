# learn

Short interactive courses, published with GitHub Pages at https://jazzman2k83.github.io/learn/

Each course is developed in its own repo, which also holds private notes, learning records and statistics. Only the course's site files are copied here, into a topic folder such as `autosar/com/`. The landing page `index.html` is generated, so don't edit it or the course folders by hand: the next publish overwrites them.

## Add a course

From any course folder that has an `index.html` and is a git repo with at least one commit:

```sh
~/myAI/Teach/_LearningsOverview/tools/setup-course.sh .
```

Or ask Claude to "publish this course" (skill `publish-course`). The setup does the following:

1. It writes `course.json` and commits it in the course repo:
   ```json
   {
     "title": "AUTOSAR COM in plain words",
     "description": "One or two sentences for the landing page.",
     "path": "autosar/com",
     "language": "en",
     "topic": "AUTOSAR",
     "publish": ["index.html", "lessons", "reference", "assets", "config"]
   }
   ```
   `path` is the folder here (lowercase, `/`-separated). `topic` is the heading the course is grouped under on the landing page. `publish` is optional; the default is the list shown, using only the entries that exist.
2. If the course repo has a GitHub remote, it installs `.github/workflows/publish-learn.yml` and sets the secret `HUB_DEPLOY_KEY`. From then on every push publishes the course.
3. It publishes the course once.

## Publish again

```sh
tools/publish.sh <course-dir>          # commit + push the hub
tools/publish.sh <course-dir> --no-push
tools/unpublish.sh autosar/com         # remove a course
```

What gets published is the course's **committed** state (`git archive HEAD`). Uncommitted edits are never published, and the script warns when it finds them. Courses without a remote publish only this way. Courses with a remote can also publish this way, and their action does the same thing.

## Deploy key

The actions push here with one deploy key that has write access on this repo. Its private half is stored outside every repo, at `~/.config/learn-hub/hub_deploy_key`, and `setup-course.sh` copies it into each course repo's `HUB_DEPLOY_KEY` secret. If the key is lost, generate a new one, add it as a deploy key here, then run `gh secret set HUB_DEPLOY_KEY -R <repo> < key` for each course repo.
