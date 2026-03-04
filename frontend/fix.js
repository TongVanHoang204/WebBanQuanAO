const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/analytics/AnalyticsPage.tsx', 'utf8');

// Colors
code = code.replace(/bg-white/g, 'bg-white dark:bg-secondary-800');
code = code.replace(/bg-\\[#f8f9fc\\]/g, 'bg-[#f8f9fc] dark:bg-secondary-900');
code = code.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
code = code.replace(/text-gray-800/g, 'text-gray-800 dark:text-gray-100');
code = code.replace(/text-gray-700/g, 'text-gray-700 dark:text-gray-300');
code = code.replace(/text-gray-600/g, 'text-gray-600 dark:text-gray-400');
code = code.replace(/text-gray-500/g, 'text-gray-500 dark:text-gray-400');
code = code.replace(/text-gray-400/g, 'text-gray-400 dark:text-gray-500');
code = code.replace(/border-gray-100/g, 'border-gray-100 dark:border-secondary-700');
code = code.replace(/border-gray-200/g, 'border-gray-200 dark:border-secondary-700');
code = code.replace(/bg-gray-50\/50/g, 'bg-gray-50/50 dark:bg-secondary-700/50');
code = code.replace(/bg-gray-100/g, 'bg-gray-100 dark:bg-secondary-700');
code = code.replace(/bg-gray-50(?!\\/)/g, 'bg-gray-50 dark:bg-secondary-700/40'); 
code = code.replace(/dark:bg-secondary-800 dark:bg-secondary-800/g, 'dark:bg-secondary-800');
code = code.replace(/dark:bg-secondary-900 dark:bg-secondary-900/g, 'dark:bg-secondary-900');

// Replace mock customers logic
const oldBlock = "const { summary, charts, topProducts } = data;";
const newBlock = "const { summary, charts, topProducts, recentCustomers = [] } = data;";
code = code.replace(oldBlock, newBlock);

// Replace contacts map
const contactsRegex = /\\{\\[1,2,3,4\\]\\.map\\(\\(i\\) => \\([\\s\\S]*?<MoreVertical className=\"w-4 h-4\" \\/>\\s*<\\/button>\\s*<\\/div>\\s*\\)\\)\\}/g;

const contactsNew = \{recentCustomers.map((user: any, idx: number) => (
                     <div key={user.id || idx} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-secondary-700/40 rounded-xl transition-colors cursor-pointer">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold border border-white dark:border-secondary-700 shadow-sm">
                                 {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'KH'}
                             </div>
                             <div>
                                 <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.full_name || 'Khách hàng ẩn danh'}</h4>
                                 <p className={"text-xs flex items-center gap-1 " + (user.is_active ? 'text-green-500' : 'text-gray-400')}>
                                    <span className={"w-1.5 h-1.5 rounded-full inline-block " + (user.is_active ? 'bg-green-500' : 'bg-gray-400')}/> 
                                    {user.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                                 </p>
                             </div>
                         </div>
                         <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                             <MoreVertical className="w-4 h-4" />
                         </button>
                     </div>
                 ))}\;

code = code.replace(contactsRegex, contactsNew);

fs.writeFileSync('src/pages/admin/analytics/AnalyticsPage.tsx', code);
console.log('Update Complete');
