require 'xcodeproj'
require 'fileutils'

repo_root = File.expand_path('..', __dir__)
project_root = File.join(repo_root, 'IngrediScore')
project_path = File.join(project_root, 'IngrediScore.xcodeproj')
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'IngrediScore' }
raise 'Target not found' unless target

canonical_assets_dir = File.join(project_root, 'IngrediScore', 'Assets.xcassets')
canonical_preview_dir = File.join(project_root, 'IngrediScore', 'Preview Content')
legacy_nested_dir = File.join(project_root, 'IngrediScore', 'IngrediScore')

# Ensure canonical dirs exist.
FileUtils.mkdir_p(File.join(canonical_assets_dir, 'AppIcon.appiconset'))
FileUtils.mkdir_p(File.join(canonical_preview_dir, 'Preview Assets.xcassets'))

# Seed canonical files if missing.
contents = {
  File.join(canonical_assets_dir, 'Contents.json') => %Q({\n  "info" : {\n    "author" : "xcode",\n    "version" : 1\n  }\n}\n),
  File.join(canonical_assets_dir, 'AppIcon.appiconset', 'Contents.json') => %Q({\n  "images" : [\n    {\n      "idiom" : "universal",\n      "platform" : "ios",\n      "size" : "1024x1024"\n    }\n  ],\n  "info" : {\n    "author" : "xcode",\n    "version" : 1\n  }\n}\n),
  File.join(canonical_preview_dir, 'Preview Assets.xcassets', 'Contents.json') => %Q({\n  "info" : {\n    "author" : "xcode",\n    "version" : 1\n  }\n}\n)
}
contents.each { |path, data| File.write(path, data) unless File.exist?(path) }

# Normalize top-level app group structure.
app_group = project.main_group['IngrediScore']
raise 'App group not found' unless app_group
app_source_group = app_group['IngrediScore'] || app_group.new_group('IngrediScore', 'IngrediScore')

# Remove old resource references from build phase.
target.resources_build_phase.files.to_a.each do |bf|
  ref = bf.file_ref
  next unless ref
  if ['Assets.xcassets', 'Preview Content'].include?(ref.display_name)
    bf.remove_from_project
  end
end

# Remove duplicate child references in the app group.
app_source_group.children.select { |c| ['Assets.xcassets', 'Preview Content'].include?(c.display_name) }.each(&:remove_from_project)

assets_ref = app_source_group.new_file('Assets.xcassets')
preview_ref = app_source_group.new_file('Preview Content')
target.resources_build_phase.add_file_reference(assets_ref, true)
target.resources_build_phase.add_file_reference(preview_ref, true)

project.save

# Clean legacy nested placeholders if they still exist.
FileUtils.rm_rf(legacy_nested_dir)
