require 'xcodeproj'
require 'fileutils'

repo_root = File.expand_path('..', __dir__)
project_dir = File.join(repo_root, 'IngrediScore')
project_path = File.join(project_dir, 'IngrediScore.xcodeproj')
app_dir = File.join(project_dir, 'IngrediScore')
source_root = File.join(repo_root, 'ingrediscore-native')

FileUtils.mkdir_p(app_dir)
FileUtils.mkdir_p(project_dir)

project = Xcodeproj::Project.new(project_path)
project.root_object.attributes['LastSwiftUpdateCheck'] = '2600'
project.root_object.attributes['LastUpgradeCheck'] = '2600'

main_group = project.main_group
main_group.set_source_tree('SOURCE_ROOT')

app_group = main_group.new_group('IngrediScore', 'IngrediScore')
source_group = main_group.new_group('ingrediscore-native', 'ingrediscore-native')

app_target = project.new_target(:application, 'IngrediScore', :ios, '18.0')
app_target.product_reference.name = 'IngrediScore.app'

app_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.jonathan.ingrediscore'
  config.build_settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  config.build_settings['INFOPLIST_KEY_UILaunchScreen_Generation'] = 'YES'
  config.build_settings['INFOPLIST_KEY_UIApplicationSceneManifest_Generation'] = 'YES'
  config.build_settings['INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents'] = 'YES'
  config.build_settings['INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone'] = 'UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight'
  config.build_settings['INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad'] = 'UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight'
  config.build_settings['INFOPLIST_KEY_CFBundleDisplayName'] = 'IngrediScore'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['SWIFT_VERSION'] = '6.0'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '18.0'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['DEVELOPMENT_TEAM'] = ''
end

resources_phase = app_target.resources_build_phase
sources_phase = app_target.source_build_phase

app_files = {
  'Assets.xcassets' => :resource,
  'Preview Content' => :resource
}

app_files.each do |name, kind|
  path = File.join(app_dir, name)
  ref = app_group.new_reference(path.sub(repo_root + '/', ''))
  if kind == :resource
    resources_phase.add_file_reference(ref, true)
  else
    sources_phase.add_file_reference(ref, true)
  end
end

Dir.glob(File.join(source_root, '**', '*')).sort.each do |path|
  next if File.directory?(path)
  rel = path.sub(repo_root + '/', '')
  ext = File.extname(path)
  ref = source_group.find_file_by_path(rel) || source_group.new_reference(rel)

  case ext
  when '.swift'
    sources_phase.add_file_reference(ref, true)
  when '.xcassets', '.plist', '.strings', '.storyboard', '.xib'
    resources_phase.add_file_reference(ref, true)
  end
end

project.save
