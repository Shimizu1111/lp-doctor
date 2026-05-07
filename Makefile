.PHONY: dev build deploy-worker deploy-pages deploy

# ローカル開発サーバー起動
dev:
	npx vite

# フロントエンドビルド
build:
	npx tsc --noEmit && npx vite build

# Cloudflare Worker デプロイ
deploy-worker:
	cd worker && npx wrangler deploy

# GitHub Pages デプロイ (push で自動デプロイ)
deploy-pages:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo ""; \
		echo "未コミットの変更があります:"; \
		git status --short; \
		echo ""; \
		read -p "コミットしてからpushしますか？ (y/N): " ans; \
		if [ "$$ans" = "y" ] || [ "$$ans" = "Y" ]; then \
			read -p "コミットメッセージ: " msg; \
			git add -A && git commit -m "$$msg"; \
		else \
			echo "pushをスキップしました"; \
			exit 0; \
		fi; \
	fi
	git push

# 全部デプロイ (Worker + Pages)
deploy: deploy-worker deploy-pages
