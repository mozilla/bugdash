web-files := $(shell find . \( -name '*.css' -o -name '*.html' -o -name '*.mjs' \) -print)
biome     := NODE_NO_WARNINGS=1 npx --yes --prefer-offline @biomejs/biome@1.9.4 check --config-path=.biome.json

.PHONY: format
format: .git/hooks/pre-commit .format-web

.format-web: .biome.json
	./cache-bust update
	$(biome) --write $(web-files)
	@touch $@

.PHONY: test
test:
	$(biome) $(web-files)
	./cache-bust check

.git/hooks/pre-commit: pre-commit
	cp pre-commit .git/hooks/pre-commit

.PHONY: run
run:
	python3 -m http.server --bind 127.0.0.1

.PHONY: clean
clean:
	rm -rf format-*

.PHONY: deploy
deploy:
	heroku git:remote -a bmo-bugdash
	git push heroku main
