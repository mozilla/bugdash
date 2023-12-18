.PHONY: format test run clean deploy

css-files:=$(wildcard app/*.css) $(wildcard app/*/*.css)
html-files:=$(wildcard *.html)
js-files:=$(wildcard app/*.mjs) $(wildcard app/*/*.mjs)
format-files=.format-css .format-js .format-html .format-cache

format: .git/hooks/pre-commit $(format-files)

.format-cache: node_modules/.updated .prettierrc $(css-files) $(js-files) $(html-files)
	./cache-bust update
	npx prettier --write $(html-files)
	@touch $@

.format-css: node_modules/.updated .stylelintrc .prettierrc $(css-files)
	npx stylelint --fix $(css-files)
	npx prettier --write $(css-files)
	@touch $@

.format-js: node_modules/.updated .prettierrc $(js-files)
	npx prettier --write $(js-files)
	@touch $@

.format-html: node_modules/.updated .prettierrc $(html-files)
	npx prettier --write $(html-files)
	@touch $@

test: node_modules/.updated
	npx stylelint $(css-files)
	npx prettier --check $(js-files)
	npx eslint $(js-files)
	./cache-bust check

.git/hooks/pre-commit: node_modules/.updated pre-commit
	cp pre-commit .git/hooks/pre-commit

node_modules/.updated: package.json
	NPM_CONFIG_UPDATE_NOTIFIER=false npm install --no-fund --no-audit
	@touch $@

run:
	python3 -m http.server --bind 127.0.0.1

clean:
	rm -rf node_modules $(format-files)

deploy:
	heroku git:remote -a bmo-bugdash
	git push heroku main
