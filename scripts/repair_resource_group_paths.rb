require 'xcodeproj'

project = Xcodeproj::Project.open('IngrediScore/IngrediScore.xcodeproj')
app_group = project.main_group['IngrediScore']
subgroup = app_group['IngrediScore']
raise 'Missing app subgroup' unless subgroup

# The subgroup currently has path "IngrediScore" relative to parent group path "IngrediScore",
# which resolves to .../IngrediScore/IngrediScore/IngrediScore. We want it to resolve to
# .../IngrediScore/IngrediScore, so make the subgroup path empty and keep child names as-is.
subgroup.path = ''

project.save
