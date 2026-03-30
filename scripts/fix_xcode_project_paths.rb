require 'xcodeproj'

project_path = File.join(__dir__, '..', 'IngrediScore', 'IngrediScore.xcodeproj')
project = Xcodeproj::Project.open(project_path)
main_group = project.main_group

target = project.targets.find { |t| t.name == 'IngrediScore' }
raise 'Target not found' unless target

# Remove existing build files from phases.
[target.resources_build_phase, target.source_build_phase].each do |phase|
  phase.files.to_a.each(&:remove_from_project)
end

# Remove and recreate top-level groups cleanly.
main_group.children.select { |c| ['IngrediScore', 'ingrediscore-native'].include?(c.display_name) }.each(&:remove_from_project)

app_group = main_group.new_group('IngrediScore', 'IngrediScore')
app_source_group = app_group.new_group('IngrediScore', 'IngrediScore')
source_group = main_group.new_group('ingrediscore-native', '../ingrediscore-native')

assets_ref = app_source_group.new_file('Assets.xcassets')
preview_ref = app_source_group.new_file('Preview Content')
target.resources_build_phase.add_file_reference(assets_ref, true)
target.resources_build_phase.add_file_reference(preview_ref, true)

Dir.glob(File.join(__dir__, '..', 'ingrediscore-native', '**', '*')).sort.each do |path|
  next if File.directory?(path)
  ext = File.extname(path)
  relative_inside_group = path.sub(File.join(__dir__, '..', 'ingrediscore-native/') , '')
  ref = source_group.new_file(relative_inside_group)

  case ext
  when '.swift'
    target.source_build_phase.add_file_reference(ref, true)
  when '.xcassets', '.plist', '.strings', '.storyboard', '.xib'
    target.resources_build_phase.add_file_reference(ref, true)
  end
end

project.save
